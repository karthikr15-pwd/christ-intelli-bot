import 'dart:convert';
import 'package:http/http.dart' as http;
import 'server_config.dart';

class NavigationService {
  static String get baseUrl => '${ServerConfig.activeBaseUrl}/navigation';

  static Future<List<dynamic>> fetchPlaces() async {
    try {
      final response = await http.get(Uri.parse('${ServerConfig.activeBaseUrl}/places'));
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return data['data'] ?? [];
      } else {
        throw Exception('Failed to load places');
      }
    } catch (e) {
      throw Exception('Error fetching places: $e');
    }
  }

  static Future<Map<String, dynamic>> fetchRoute({
    required double userLatitude,
    required double userLongitude,
    required String destinationPlaceId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/route'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'userLatitude': userLatitude,
          'userLongitude': userLongitude,
          'destinationPlaceId': destinationPlaceId,
        }),
      );
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        return data['data']; // Returns { route: {...}, checkpoints: [...] }
      } else {
        throw Exception('Failed to load route details: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error fetching route: $e');
    }
  }
}
