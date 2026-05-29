import 'dart:convert';
import 'package:http/http.dart' as http;
import 'server_config.dart';

class ApiService {
  static String get baseUrl => ServerConfig.activeBaseUrl;

  static Future<Map<String, dynamic>> getCanteens() async {
    final response = await http.get(Uri.parse('$baseUrl/canteen'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load canteens');
    }
  }

  static Future<Map<String, dynamic>> getMenuItemsByCanteen(String canteenId) async {
    final response = await http.get(Uri.parse('$baseUrl/canteen/$canteenId/items'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load menu items');
    }
  }

  static Future<Map<String, dynamic>> searchMenuItems(String query) async {
    final response = await http.get(Uri.parse('$baseUrl/canteen/search?q=$query'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to search menu items');
    }
  }

  static Future<Map<String, dynamic>> chat(String message) async {
    final response = await http.post(
      Uri.parse('$baseUrl/chat'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'message': message}),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to send message');
    }
  }

  static Future<List<dynamic>> getFaculty() async {
    final response = await http.get(Uri.parse('$baseUrl/faculty'));
    if (response.statusCode == 200) {
      final Map<String, dynamic> data = json.decode(response.body);
      return data['data'] ?? [];
    } else {
      throw Exception('Failed to load faculty directory');
    }
  }
}
