import 'package:flutter/material.dart';
import 'dart:ui';
import '../services/api_service.dart';
import 'navigation_screen.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final bool isNavigationTrigger;
  final String? targetDestination;
  final Map<String, dynamic>? navigationPayload;
  final bool isBroadTopic;
  final List<String>? suggestedChips;

  ChatMessage({
    required this.text, 
    required this.isUser,
    this.isNavigationTrigger = false,
    this.targetDestination,
    this.navigationPayload,
    this.isBroadTopic = false,
    this.suggestedChips,
  });
}

class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isLoading = false;

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _sendMessage([String? textArg]) async {
    final text = textArg ?? _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true));
      _isLoading = true;
    });
    _controller.clear();
    
    Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);

    try {
      final response = await ApiService.chat(text);
      final replyText = response['reply'] ?? 'Received empty response.';
      final actionType = response['actionType'];
      final spatialTarget = response['spatialTarget']?.toString();
      final navPayload = response['navigationPayload'];
      
      List<String>? chips;
      if (response['suggestedChips'] != null && response['suggestedChips'] is List) {
        chips = List<String>.from(response['suggestedChips']);
      }

      setState(() {
        _messages.add(ChatMessage(
          text: response['reply'] ?? "I couldn't process that.",
          isUser: false,
          isNavigationTrigger: actionType == 'NAVIGATE',
          targetDestination: spatialTarget,
          navigationPayload: navPayload,
          isBroadTopic: actionType == 'BROAD_TOPIC',
          suggestedChips: chips,
        ));
        _isLoading = false;
      });
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    } catch (e) {
      setState(() {
        _messages.add(ChatMessage(
          text: 'Sorry, I am having trouble connecting to the server. Please try again.',
          isUser: false,
        ));
        _isLoading = false;
      });
      Future.delayed(const Duration(milliseconds: 100), _scrollToBottom);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Intelli-Bot AI', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.5)),
            Text('Online', style: TextStyle(fontSize: 12, color: Color(0xFF86EFAC), fontWeight: FontWeight.bold)),
          ],
        ),
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline_rounded),
            onPressed: () {},
          )
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDBEAFE).withOpacity(0.5),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.auto_awesome_rounded,
                            size: 64,
                            color: Color(0xFF3B82F6),
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          'How can I help you today?',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF1E293B),
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Ask me about locations, menus, or faculty.',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                    itemCount: _messages.length + (_isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _messages.length && _isLoading) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 24, left: 8),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.only(
                                  topLeft: Radius.circular(20),
                                  topRight: Radius.circular(20),
                                  bottomRight: Radius.circular(20),
                                ),
                              ),
                              child: const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
                                ),
                              ),
                            ),
                          ),
                        );
                      }

                      final message = _messages[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Align(
                          alignment: message.isUser ? Alignment.centerRight : Alignment.centerLeft,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (!message.isUser)
                                Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.all(6),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFF1E3A8A),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.auto_awesome_rounded, size: 14, color: Colors.white),
                                ),
                              
                              Flexible(
                                child: Column(
                                  crossAxisAlignment: message.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                                      decoration: BoxDecoration(
                                        gradient: message.isUser
                                            ? const LinearGradient(
                                                colors: [Color(0xFF3B82F6), Color(0xFF4F46E5)],
                                                begin: Alignment.topLeft,
                                                end: Alignment.bottomRight,
                                              )
                                            : null,
                                        color: message.isUser ? null : Colors.white,
                                        borderRadius: BorderRadius.only(
                                          topLeft: const Radius.circular(24),
                                          topRight: const Radius.circular(24),
                                          bottomLeft: Radius.circular(message.isUser ? 24 : 8),
                                          bottomRight: Radius.circular(message.isUser ? 8 : 24),
                                        ),
                                        boxShadow: [
                                          if (!message.isUser)
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.03),
                                              blurRadius: 10,
                                              offset: const Offset(0, 4),
                                            )
                                          else
                                            BoxShadow(
                                              color: const Color(0xFF3B82F6).withOpacity(0.3),
                                              blurRadius: 10,
                                              offset: const Offset(0, 4),
                                            )
                                        ],
                                      ),
                                      child: Text(
                                        message.text,
                                        style: TextStyle(
                                          color: message.isUser ? Colors.white : const Color(0xFF334155),
                                          fontSize: 15,
                                          fontWeight: FontWeight.w500,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                    if (message.isNavigationTrigger && message.targetDestination != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 8.0),
                                        child: ElevatedButton.icon(
                                          onPressed: () {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) => NavigationScreen(
                                                  prefilledTarget: message.navigationPayload ?? {'name': message.targetDestination}
                                                ),
                                              ),
                                            );
                                          },
                                          icon: const Icon(Icons.location_on, size: 18),
                                          label: Text(
                                            '📍 Start AR Navigation to ${message.targetDestination}',
                                            style: const TextStyle(fontWeight: FontWeight.bold),
                                          ),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF10B981), // Emerald 500
                                            foregroundColor: Colors.white,
                                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(20),
                                            ),
                                            elevation: 4,
                                          ),
                                        ),
                                      ),
                                    if (message.isBroadTopic && message.suggestedChips != null && message.suggestedChips!.isNotEmpty)
                                      Container(
                                        margin: const EdgeInsets.only(top: 12),
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: Colors.white.withOpacity(0.8),
                                          borderRadius: BorderRadius.circular(16),
                                          border: Border.all(color: const Color(0xFFE2E8F0)),
                                        ),
                                        child: Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          children: message.suggestedChips!.map((chipText) {
                                            return ActionChip(
                                              label: Text(
                                                chipText,
                                                style: const TextStyle(
                                                  color: Color(0xFF3B82F6),
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 13,
                                                ),
                                              ),
                                              backgroundColor: const Color(0xFFDBEAFE),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(20),
                                                side: const BorderSide(color: Color(0xFFBFDBFE)),
                                              ),
                                              onPressed: () {
                                                _sendMessage(chipText);
                                              },
                                            );
                                          }).toList(),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          
          // Input Area
          ClipRRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
              child: Container(
                padding: const EdgeInsets.only(left: 16, right: 16, top: 12, bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.8),
                  border: Border(top: BorderSide(color: Colors.white.withOpacity(0.5))),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: TextField(
                          controller: _controller,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _sendMessage(),
                          style: const TextStyle(fontWeight: FontWeight.w500, color: Color(0xFF1E293B)),
                          decoration: const InputDecoration(
                            hintText: 'Type a message...',
                            hintStyle: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    GestureDetector(
                      onTap: _isLoading ? null : _sendMessage,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF3B82F6).withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
