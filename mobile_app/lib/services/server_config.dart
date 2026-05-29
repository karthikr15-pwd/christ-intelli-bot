import 'dart:async';
import 'package:http/http.dart' as http;

class ServerConfig {
  // Statically configured local Wi-Fi IP address as the primary fallback
  static const String fallbackIp = '172.16.211.215';
  
  static String activeBaseUrl = 'https://christ-intelli-bot-backend.onrender.com/api';

  static Future<void> detectActiveServer() async {
    final List<String> candidates = [
      'http://localhost:5000/api',     // USB connected device with ADB reverse, Web, iOS Simulator
      'http://10.0.2.2:5000/api',       // Android Emulator standard host loopback
      'http://172.16.211.215:5000/api', // Current Wi-Fi network host address segment
    ];

    print('ServerConfig: Initializing network connectivity diagnostics...');

    final List<Future<String?>> pingFutures = candidates.map((url) async {
      try {
        final response = await http.get(Uri.parse('$url/health')).timeout(const Duration(milliseconds: 1500));
        if (response.statusCode == 200) {
          print('ServerConfig: Connection verified for candidate URL -> $url');
          return url;
        }
      } catch (e) {
        print('ServerConfig: Diagnostic check failed for candidate $url: $e');
      }
      return null;
    }).toList();

    try {
      final results = await Future.wait(pingFutures);
      for (final result in results) {
        if (result != null) {
          activeBaseUrl = result;
          print('ServerConfig: Dynamic Host Routing Engine active -> $activeBaseUrl');
          return;
        }
      }
    } catch (err) {
      print('ServerConfig: Diagnostic runner encountered exception: $err');
    }

    print('ServerConfig: All live checks failed or timed out. Falling back to default: $activeBaseUrl');
  }
}
