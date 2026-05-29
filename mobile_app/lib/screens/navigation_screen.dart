import 'dart:async';
import 'dart:math' show cos, sin, pi, sqrt, atan2;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:camera/camera.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter_typeahead/flutter_typeahead.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import '../services/navigation_service.dart';
import '../widgets/indoor_map_view.dart';

// Math Helpers
double _toRadians(double degree) => degree * pi / 180;
double _toDegrees(double radian) => radian * 180 / pi;

double calculateBearing(double startLat, double startLng, double destLat, double destLng) {
  final startLatRad = _toRadians(startLat);
  final startLngRad = _toRadians(startLng);
  final destLatRad = _toRadians(destLat);
  final destLngRad = _toRadians(destLng);

  final y = sin(destLngRad - startLngRad) * cos(destLatRad);
  final x = cos(startLatRad) * sin(destLatRad) -
      sin(startLatRad) * cos(destLatRad) * cos(destLngRad - startLngRad);

  final bearing = atan2(y, x);
  return (_toDegrees(bearing) + 360) % 360;
}

double normalizeAngle(double angle) {
  angle = angle % 360;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const R = 6371e3; // Earth radius in meters
  final dLat = _toRadians(lat2 - lat1);
  final dLon = _toRadians(lon2 - lon1);

  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
      sin(dLon / 2) * sin(dLon / 2);
  final c = 2 * atan2(sqrt(a), sqrt(1 - a));

  return R * c;
}

class NavigationScreen extends StatefulWidget {
  final dynamic prefilledTarget;
  const NavigationScreen({super.key, this.prefilledTarget});

  @override
  State<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends State<NavigationScreen> {
  int _parseFloorLevel(dynamic val) {
    if (val == null) return 0;
    if (val is num) return val.toInt();
    return int.tryParse(val.toString()) ?? 0;
  }

  // Google Maps State
  final Completer<GoogleMapController> _mapController = Completer();
  final Set<Polyline> _polylines = {};
  final Set<Marker> _markers = {};
  
  // Locations Data
  List<dynamic> allPlaces = [];
  dynamic selectedEndPlace;
  bool isLoading = true;

  // Search Controllers
  final TextEditingController _endController = TextEditingController();

  // Route State
  bool isNavigating = false;
  bool hasArrivedAtBuilding = false;
  int? currentIndoorFloor;
  List<dynamic> checkpoints = [];
  int currentStepIndex = 0;
  int currentWaypointIndex = 0; // Pointer tracking active waypoints
  double routeDistance = 0.0;

  // Polyline Data
  List<LatLng> polylineCoordinates = [];
  late PolylinePoints polylinePoints;
  static const String googleMapsApiKey = "AIzaSyADoNy7X6QXLuq64gVIftPJSzDsbg4iITs"; // Dynamic Backend-driven Route in Use

  // Hardware State
  Position? currentPosition;
  StreamSubscription<Position>? _positionStream;
  double currentHeading = 0.0;
  StreamSubscription<CompassEvent>? _compassStream;
  
  CameraController? _cameraController;
  List<CameraDescription>? cameras;
  bool _isCameraInitialized = false;
  
  // Accelerometer State
  bool isUpright = false;
  StreamSubscription<AccelerometerEvent>? _accelerometerSubscription;

  @override
  void initState() {
    super.initState();
    polylinePoints = PolylinePoints(apiKey: googleMapsApiKey);
    _initializePermissionsAndHardware();
    _loadPlaces();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.prefilledTarget != null) {
        final buildingName = widget.prefilledTarget['buildingName'] ?? widget.prefilledTarget['blockName'] ?? widget.prefilledTarget['name'] ?? '';
        if (buildingName.isNotEmpty) {
          _endController.text = buildingName;
        }

        final double lat = widget.prefilledTarget['latitude'] is String ? double.parse(widget.prefilledTarget['latitude'].toString()) : (widget.prefilledTarget['latitude'] as num).toDouble();
        final double lng = widget.prefilledTarget['longitude'] is String ? double.parse(widget.prefilledTarget['longitude'].toString()) : (widget.prefilledTarget['longitude'] as num).toDouble();
        
        selectedEndPlace = widget.prefilledTarget;
        currentIndoorFloor = _parseFloorLevel(widget.prefilledTarget['floorLevel']);
        
        generateWalkingRoute(lat, lng);
      }
    });
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _compassStream?.cancel();
    _accelerometerSubscription?.cancel();
    _cameraController?.dispose();
    _endController.dispose();
    super.dispose();
  }

  Future<void> _initializePermissionsAndHardware() async {
    Map<Permission, PermissionStatus> statuses = await [
      Permission.camera,
      Permission.locationWhenInUse,
    ].request();

    if (statuses[Permission.locationWhenInUse]!.isGranted) {
      try {
        currentPosition = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.bestForNavigation);
        if (currentPosition != null && !isNavigating) {
          _moveCameraTo(LatLng(currentPosition!.latitude, currentPosition!.longitude));
        }
      } catch (_) {}

      // Instantiate Geolocator.getPositionStream with high-accuracy parameters and 0m filter
      _positionStream = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.bestForNavigation, distanceFilter: 0),
      ).listen((Position position) {
        if (mounted) {
          setState(() {
            currentPosition = position;
          });
          
          if (isNavigating) {
            _checkWaypointProximity(position);
            _moveCameraTo(LatLng(position.latitude, position.longitude));
            _updateMapOverlays();

            // Geofence Trigger for Last Mile Hand-off
            if (selectedEndPlace != null && !hasArrivedAtBuilding) {
              double destLat = selectedEndPlace['latitude'] is String ? double.parse(selectedEndPlace['latitude']) : (selectedEndPlace['latitude'] as num).toDouble();
              double destLng = selectedEndPlace['longitude'] is String ? double.parse(selectedEndPlace['longitude']) : (selectedEndPlace['longitude'] as num).toDouble();
              
              if (selectedEndPlace['entranceLatitude'] != null && selectedEndPlace['entranceLongitude'] != null) {
                destLat = selectedEndPlace['entranceLatitude'] is String ? double.parse(selectedEndPlace['entranceLatitude'].toString()) : (selectedEndPlace['entranceLatitude'] as num).toDouble();
                destLng = selectedEndPlace['entranceLongitude'] is String ? double.parse(selectedEndPlace['entranceLongitude'].toString()) : (selectedEndPlace['entranceLongitude'] as num).toDouble();
              }
              
              final distanceToDest = calculateDistance(position.latitude, position.longitude, destLat, destLng);
              
              bool reqIndoorNav = selectedEndPlace['requiresIndoorNav'] == true || selectedEndPlace['requiresIndoorNav'] == 'true';
              if (distanceToDest <= 15.0 && reqIndoorNav) {
                setState(() {
                  hasArrivedAtBuilding = true;
                  currentIndoorFloor = _parseFloorLevel(selectedEndPlace['floorLevel']);
                });
              }
            }
          }
        }
      });
      
      _compassStream = FlutterCompass.events?.listen((CompassEvent event) {
        if (mounted && event.heading != null) {
          setState(() {
            currentHeading = event.heading!;
          });
        }
      });
    }

    if (statuses[Permission.camera]!.isGranted) {
      cameras = await availableCameras();
      if (cameras != null && cameras!.isNotEmpty) {
        _cameraController = CameraController(
          cameras![0],
          ResolutionPreset.max,
          enableAudio: false,
        );
        await _cameraController!.initialize();
        if (mounted) {
          setState(() {
            _isCameraInitialized = true;
          });
        }
      }
    }

    // Initialize Accelerometer for auto-switching
    _accelerometerSubscription = accelerometerEventStream().listen((AccelerometerEvent event) {
      if (mounted) {
        if (event.y > 6.0) {
          if (!isUpright) {
            setState(() {
              isUpright = true;
            });
          }
        } else if (event.z > 7.0) {
          if (isUpright) {
            setState(() {
              isUpright = false;
            });
          }
        }
      }
    });
  }

  // Real-Time Turn Instruction Snapping check
  void _checkWaypointProximity(Position pos) {
    if (checkpoints.isEmpty || currentWaypointIndex >= checkpoints.length) return;
    final cp = checkpoints[currentWaypointIndex];
    if (cp['latitude'] != null && cp['longitude'] != null) {
      final double lat = cp['latitude'] is String ? double.parse(cp['latitude']) : (cp['latitude'] as num).toDouble();
      final double lng = cp['longitude'] is String ? double.parse(cp['longitude']) : (cp['longitude'] as num).toDouble();
      
      final distance = calculateDistance(pos.latitude, pos.longitude, lat, lng);
      // If distance drops below 8.0 meters, snap to the next waypoint milestone
      if (distance < 8.0) {
        _nextWaypoint();
      }
    }
  }

  void _nextWaypoint() {
    if (currentWaypointIndex < checkpoints.length - 1) {
      setState(() {
        currentWaypointIndex++;
        currentStepIndex = currentWaypointIndex; // Keep both synced
      });
      _updateMapOverlays();
    } else {
      _finishRoute();
    }
  }

  void _nextStep() {
    _nextWaypoint();
  }

  Future<void> _loadPlaces() async {
    try {
      final fetchedPlaces = await NavigationService.fetchPlaces();
      setState(() {
        allPlaces = _getUniquePlaces(fetchedPlaces);
        isLoading = false;

        // prefilledTarget is now handled by the post-frame callback in initState
      });
    } catch (e) {
      if (mounted) {
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading places: $e')));
      }
    }
  }

  List<dynamic> _getUniquePlaces(List<dynamic> places) {
    final seenIds = <String>{};
    final uniquePlaces = [];
    for (var place in places) {
      final String id = (place['_id'] ?? place['id'])?.toString() ?? '';
      if (id.isNotEmpty && !seenIds.contains(id)) {
        seenIds.add(id);
        uniquePlaces.add(place);
      }
    }
    return uniquePlaces;
  }

  List<dynamic> _getSuggestions(String query) {
    if (query.isEmpty) return allPlaces;
    final lowercaseQuery = query.toLowerCase();
    return allPlaces.where((place) {
      return place['name'].toString().toLowerCase().contains(lowercaseQuery);
    }).toList();
  }

  IconData _getTurnIcon(String turnType) {
    switch (turnType.toUpperCase()) {
      case 'LEFT':
        return Icons.turn_left;
      case 'RIGHT':
        return Icons.turn_right;
      case 'ARRIVED':
        return Icons.check_circle;
      default:
        return Icons.arrow_upward;
    }
  }

  Future<void> _fitMapBounds(double lat1, double lng1, double lat2, double lng2) async {
    final GoogleMapController controller = await _mapController.future;
    
    double minLat = lat1 < lat2 ? lat1 : lat2;
    double maxLat = lat1 > lat2 ? lat1 : lat2;
    double minLng = lng1 < lng2 ? lng1 : lng2;
    double maxLng = lng1 > lng2 ? lng1 : lng2;
    
    LatLngBounds bounds = LatLngBounds(
      southwest: LatLng(minLat, minLng),
      northeast: LatLng(maxLat, maxLng),
    );
    
    controller.animateCamera(CameraUpdate.newLatLngBounds(bounds, 50.0));
  }

  Future<void> generateWalkingRoute(double destLat, double destLng) async {
    for (int i = 0; i < 20; i++) {
      if (currentPosition != null) break;
      await Future.delayed(const Duration(milliseconds: 200));
    }
    if (currentPosition == null) return;
    
    setState(() => isLoading = true);

    try {
      final String destinationPlaceId = (selectedEndPlace != null ? (selectedEndPlace['_id'] ?? selectedEndPlace['id']) : '')?.toString() ?? '';
      
      dynamic routeData;
      if (destinationPlaceId.isNotEmpty) {
        routeData = await NavigationService.fetchRoute(
          userLatitude: currentPosition!.latitude,
          userLongitude: currentPosition!.longitude,
          destinationPlaceId: destinationPlaceId,
        );
      } else {
        throw Exception('No destination ID for backend route');
      }

      final List<dynamic> cpList = routeData['checkpoints'] ?? [];

      if (cpList.isNotEmpty) {
        if (mounted) {
          setState(() {
            checkpoints = cpList;
            currentWaypointIndex = 0;
            currentStepIndex = 0;
            
            polylineCoordinates = cpList.map((p) {
              final double lat = p['latitude'] is String ? double.parse(p['latitude']) : (p['latitude'] as num).toDouble();
              final double lng = p['longitude'] is String ? double.parse(p['longitude']) : (p['longitude'] as num).toDouble();
              return LatLng(lat, lng);
            }).toList();
            
            isNavigating = true;
            isLoading = false;
            _calculateTotalDistance();
          });
        }
        _updateMapOverlays();
        _showRouteBottomSheet();
        _fitMapBounds(currentPosition!.latitude, currentPosition!.longitude, destLat, destLng);
      } else {
        throw Exception('No checkpoints');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          polylineCoordinates = [
            LatLng(currentPosition!.latitude, currentPosition!.longitude),
            LatLng(destLat, destLng)
          ];
          
          checkpoints = [
            {
              'latitude': destLat,
              'longitude': destLng,
              'landmarkName': _endController.text.isNotEmpty ? _endController.text : 'Destination',
              'turnType': 'ARRIVED',
              'customInstruction': 'Head directly to destination.'
            }
          ];
          isNavigating = true;
          currentWaypointIndex = 0;
          currentStepIndex = 0;
          isLoading = false;
          _calculateTotalDistance();
        });
      }
      _updateMapOverlays();
      _showRouteBottomSheet();
      _fitMapBounds(currentPosition!.latitude, currentPosition!.longitude, destLat, destLng);
    }
  }

  Future<void> _findRoute() async {
    if (selectedEndPlace == null || currentPosition == null) return;
    
    final double destLat = selectedEndPlace['latitude'] is String ? double.parse(selectedEndPlace['latitude']) : (selectedEndPlace['latitude'] as num).toDouble();
    final double destLng = selectedEndPlace['longitude'] is String ? double.parse(selectedEndPlace['longitude']) : (selectedEndPlace['longitude'] as num).toDouble();
    
    await generateWalkingRoute(destLat, destLng);
  }

  void _calculateTotalDistance() {
    routeDistance = 0.0;
    if (currentPosition != null && checkpoints.isNotEmpty) {
      final cp1 = checkpoints[0];
      if (cp1['latitude'] != null && cp1['longitude'] != null) {
        final lat1 = cp1['latitude'] is String ? double.parse(cp1['latitude']) : (cp1['latitude'] as num).toDouble();
        final lon1 = cp1['longitude'] is String ? double.parse(cp1['longitude']) : (cp1['longitude'] as num).toDouble();
        routeDistance += calculateDistance(currentPosition!.latitude, currentPosition!.longitude, lat1, lon1);
      }
    }

    for (int i = 0; i < checkpoints.length - 1; i++) {
      final cp1 = checkpoints[i];
      final cp2 = checkpoints[i + 1];
      if (cp1['latitude'] != null && cp1['longitude'] != null && cp2['latitude'] != null && cp2['longitude'] != null) {
        final lat1 = cp1['latitude'] is String ? double.parse(cp1['latitude']) : (cp1['latitude'] as num).toDouble();
        final lon1 = cp1['longitude'] is String ? double.parse(cp1['longitude']) : (cp1['longitude'] as num).toDouble();
        final lat2 = cp2['latitude'] is String ? double.parse(cp2['latitude']) : (cp2['latitude'] as num).toDouble();
        final lon2 = cp2['longitude'] is String ? double.parse(cp2['longitude']) : (cp2['longitude'] as num).toDouble();
        routeDistance += calculateDistance(lat1, lon1, lat2, lon2);
      }
    }
  }

  void _updateMapOverlays() {
    _polylines.clear();
    _markers.clear();
    List<LatLng> points = [];

    if (currentPosition != null) {
      points.add(LatLng(currentPosition!.latitude, currentPosition!.longitude));
    }

    for (int i = currentWaypointIndex; i < checkpoints.length; i++) {
      final cp = checkpoints[i];
      if (cp['latitude'] != null && cp['longitude'] != null) {
        final double lat = cp['latitude'] is String ? double.parse(cp['latitude']) : (cp['latitude'] as num).toDouble();
        final double lng = cp['longitude'] is String ? double.parse(cp['longitude']) : (cp['longitude'] as num).toDouble();
        final latLng = LatLng(lat, lng);
        points.add(latLng);

        _markers.add(Marker(
          markerId: MarkerId('checkpoint_$i'),
          position: latLng,
          infoWindow: InfoWindow(title: cp['landmarkName'] ?? 'Waypoint'),
          icon: BitmapDescriptor.defaultMarkerWithHue(i == checkpoints.length - 1 ? BitmapDescriptor.hueRed : BitmapDescriptor.hueCyan),
        ));
      }
    }

    if (points.isNotEmpty) {
      _polylines.add(Polyline(
        polylineId: const PolylineId('route'),
        points: points,
        color: const Color(0xFF00FF87), // Neon Green
        width: 6,
      ));
    }
  }

  Future<void> _moveCameraTo(LatLng target) async {
    final GoogleMapController controller = await _mapController.future;
    controller.animateCamera(CameraUpdate.newCameraPosition(
      CameraPosition(target: target, zoom: 18.5, tilt: 45), 
    ));
  }



  void _finishRoute() {
    setState(() {
      isNavigating = false;
      hasArrivedAtBuilding = false;
      checkpoints.clear();
      _polylines.clear();
      _markers.clear();
      currentStepIndex = 0;
      currentWaypointIndex = 0;
      selectedEndPlace = null;
      _endController.clear();
      routeDistance = 0.0;
    });
    
    if (currentPosition != null) {
      _moveCameraTo(LatLng(currentPosition!.latitude, currentPosition!.longitude));
    }
  }

  void _showRouteBottomSheet() {
    final destName = selectedEndPlace != null ? selectedEndPlace['name'] : 'Destination';
    showModalBottomSheet(
      context: context,
      barrierColor: Colors.transparent,
      backgroundColor: Colors.transparent,
      isDismissible: false,
      enableDrag: false,
      builder: (context) {
        return Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E), // Dark Mode
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white12),
            boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 15, offset: Offset(0, 5))],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Route to $destName',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                'Total Distance: ${routeDistance.toStringAsFixed(0)} meters',
                style: const TextStyle(fontSize: 16, color: Colors.white70),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context); // Close sheet
                },
                icon: const Icon(Icons.navigation, color: Colors.black),
                label: const Text('Start Navigation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF00FF87), // Neon Green
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  _finishRoute();
                },
                child: const Text('Cancel', style: TextStyle(color: Colors.redAccent, fontSize: 16)),
              )
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    // Calculate real-time distance to active waypoint for the notification bubble
    double activeWaypointDistance = 0.0;
    if (currentPosition != null && checkpoints.isNotEmpty && currentWaypointIndex < checkpoints.length) {
      final cp = checkpoints[currentWaypointIndex];
      final double lat = cp['latitude'] is String ? double.parse(cp['latitude']) : (cp['latitude'] as num).toDouble();
      final double lng = cp['longitude'] is String ? double.parse(cp['longitude']) : (cp['longitude'] as num).toDouble();
      activeWaypointDistance = calculateDistance(currentPosition!.latitude, currentPosition!.longitude, lat, lng);
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Camera Background (Only visible when upright)
          if (_isCameraInitialized && !hasArrivedAtBuilding)
            AnimatedOpacity(
              opacity: isUpright ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: CameraPreview(_cameraController!),
            ),

          // 2. AR Overlays Layer
          if (isNavigating && !hasArrivedAtBuilding)
            AnimatedOpacity(
              opacity: isUpright ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: isUpright ? _buildAROverlays() : const SizedBox(),
            ),

          // 3. Google Maps Layer (Animated between full screen and bottom map)
          if (!hasArrivedAtBuilding)
            AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
            top: isUpright ? (screenHeight * 0.75) : 0,
            bottom: isUpright ? 30 : 0,
            left: isUpright ? 20 : 0,
            right: isUpright ? 20 : 0,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(isUpright ? 24 : 0),
              child: isUpright
                  ? BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.3),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
                          boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 10, offset: Offset(0, 4))],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: IgnorePointer(
                            ignoring: true, // Disable map interaction in AR mode
                            child: GoogleMap(
                              initialCameraPosition: const CameraPosition(
                                target: LatLng(12.861501, 77.438512),
                                zoom: 16,
                              ),
                              myLocationEnabled: true,
                              myLocationButtonEnabled: false,
                              polylines: _polylines,
                              markers: _markers,
                              zoomControlsEnabled: false,
                              compassEnabled: false,
                              onMapCreated: (GoogleMapController controller) {
                                if (!_mapController.isCompleted) {
                                  _mapController.complete(controller);
                                }
                              },
                            ),
                          ),
                        ),
                      ),
                    )
                  : Container(
                      child: GoogleMap(
                        initialCameraPosition: const CameraPosition(
                          target: LatLng(12.861501, 77.438512),
                          zoom: 16,
                        ),
                        myLocationEnabled: true,
                        myLocationButtonEnabled: true,
                        polylines: _polylines,
                        markers: _markers,
                        padding: const EdgeInsets.only(top: 130),
                        zoomControlsEnabled: true,
                        compassEnabled: true,
                        onMapCreated: (GoogleMapController controller) {
                          if (!_mapController.isCompleted) {
                            _mapController.complete(controller);
                          }
                        },
                      ),
                    ),
            ),
          ),

          // 4. Live Turn Instruction Bubble (Glassmorphic Notification Overlay)
          if (isNavigating && checkpoints.isNotEmpty && currentWaypointIndex < checkpoints.length && !hasArrivedAtBuilding)
            Positioned(
              top: 130,
              left: 16,
              right: 16,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.75),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFF00FF87).withOpacity(0.4), width: 1.5),
                      boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10, offset: Offset(0, 4))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(color: Color(0xFF1C1C1E), shape: BoxShape.circle),
                          child: Icon(
                            _getTurnIcon(checkpoints[currentWaypointIndex]['turnType']?.toString() ?? 'STRAIGHT'),
                            color: const Color(0xFF00FF87),
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            "In ${activeWaypointDistance.toStringAsFixed(0)} meters, prepare to take a ${(checkpoints[currentWaypointIndex]['turnType']?.toString() ?? 'STRAIGHT').toLowerCase()} turn near ${checkpoints[currentWaypointIndex]['landmarkName'] ?? 'milestone'}",
                            style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          // 5. Floating Search Bar Glassmorphism UI (Only visible when flat and not navigating)
          if (!isNavigating && !hasArrivedAtBuilding)
            Positioned(
              top: 50,
              left: 16,
              right: 16,
              child: AnimatedOpacity(
                opacity: isUpright ? 0.0 : 1.0,
                duration: const Duration(milliseconds: 300),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.65),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                        boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 10, offset: Offset(0, 4))],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _buildTypeAheadField('Where to?', _endController, (val) {
                            setState(() => selectedEndPlace = val);
                            _findRoute(); 
                          }),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // 6. Instruction text: Raise phone
          if (isNavigating && !isUpright && !hasArrivedAtBuilding)
            Positioned(
              top: 80,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 24),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: const Color(0xFF00FF87).withOpacity(0.5)),
                  boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 10)],
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.screen_rotation, color: Color(0xFF00FF87), size: 20),
                    SizedBox(width: 12),
                    Text(
                      'Raise phone for AR View',
                      style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),

          if (isLoading)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(child: CircularProgressIndicator(color: Color(0xFF00FF87))),
            ),

          // 7. Indoor Guide Modal (Hand-off Protocol)
          if (hasArrivedAtBuilding)
            _buildIndoorGuideCard(),
        ],
      ),
    );
  }

  Widget _buildAROverlays() {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    // We only need the top 75% for AR, bottom 25% is mini-map
    final arHeight = screenHeight * 0.75; 

    List<Widget> arWidgets = [];

    if (currentPosition != null && checkpoints.isNotEmpty && currentWaypointIndex < checkpoints.length) {
      // Perspective projection loops for the next 3 path waypoints
      int pointsToDraw = 3; 
      int maxIndex = (currentWaypointIndex + pointsToDraw < checkpoints.length) 
          ? currentWaypointIndex + pointsToDraw 
          : checkpoints.length;

      for (int i = maxIndex - 1; i >= currentWaypointIndex; i--) { // Draw further ones first (z-index)
        final cp = checkpoints[i];
        if (cp['latitude'] != null && cp['longitude'] != null) {
          final double destLat = cp['latitude'] is String ? double.parse(cp['latitude']) : (cp['latitude'] as num).toDouble();
          final double destLng = cp['longitude'] is String ? double.parse(cp['longitude']) : (cp['longitude'] as num).toDouble();
          
          double distance = calculateDistance(currentPosition!.latitude, currentPosition!.longitude, destLat, destLng);
          double bearing = calculateBearing(currentPosition!.latitude, currentPosition!.longitude, destLat, destLng);
          double angleDiff = normalizeAngle(bearing - currentHeading);

          // Horizon Vanishing Point X
          double xVP = (screenWidth / 2) + (angleDiff * (screenWidth / 120.0));

          // Target Checkpoint True Projected Coordinates
          double targetT = (distance / 40.0).clamp(0.0, 1.0);
          double targetX = (screenWidth / 2) + ((xVP - (screenWidth / 2)) * targetT);
          double targetY = arHeight - (distance * ((arHeight * 0.6) / 40.0));
          if (distance > 40) targetY = arHeight * 0.4;
          if (targetY > arHeight) targetY = arHeight;
          double targetSize = (50 - distance).clamp(10.0, 50.0);

          // Draw the Virtual Trail (dots every 3m) towards the immediate next checkpoint
          if (i == currentWaypointIndex) {
             for (double d = 40.0; d >= 3.0; d -= 3.0) {
                  if (d > distance && distance > 3.0) continue; // Don't draw past the checkpoint
                  
                  double t = (d / 40.0).clamp(0.0, 1.0); // Ratio to horizon

                  // True Perspective X: Interpolate from bottom-center to xVP
                  double trailX = (screenWidth / 2) + ((xVP - (screenWidth / 2)) * t);
                  double trailY = arHeight - (d * ((arHeight * 0.6) / 40.0));
                  if (trailY > arHeight) trailY = arHeight;
                  
                  double trailSize = (50 - d).clamp(10.0, 50.0);
                  double opacity = (1.0 - t).clamp(0.1, 0.8);
                  
                  arWidgets.add(
                     Positioned(
                       left: trailX - (trailSize / 2),
                       top: trailY - (trailSize / 2),
                       child: Container(
                         width: trailSize,
                         height: trailSize,
                         decoration: BoxDecoration(
                           color: Colors.blueAccent.withOpacity(opacity),
                           shape: BoxShape.circle,
                           boxShadow: [
                             BoxShadow(color: Colors.blueAccent.withOpacity(opacity * 0.5), blurRadius: 10, spreadRadius: 2),
                           ],
                         ),
                       ),
                     ),
                   );
             }
          } else {
            double opacity = (1.0 - targetT).clamp(0.1, 0.8);
            arWidgets.add(
              Positioned(
                left: targetX - (targetSize / 2),
                top: targetY - (targetSize / 2),
                child: Container(
                  width: targetSize,
                  height: targetSize,
                  decoration: BoxDecoration(
                    color: Colors.blueAccent.withOpacity(opacity),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.blueAccent.withOpacity(opacity * 0.5), blurRadius: 10, spreadRadius: 2),
                    ],
                  ),
                ),
              ),
            );
          }

          // Draw the Pizza Sign Pill over the FIRST upcoming checkpoint
          if (i == currentWaypointIndex) {
            IconData turnIcon = Icons.arrow_upward;
            // Predict upcoming turn
            if (polylineCoordinates.length > currentWaypointIndex + 3) {
              final LatLng p0 = polylineCoordinates[currentWaypointIndex];
              final LatLng p3 = polylineCoordinates[currentWaypointIndex + 3];
              
              double bearingToNext = calculateBearing(p0.latitude, p0.longitude, p3.latitude, p3.longitude);
              double turnAngle = normalizeAngle(bearingToNext - currentHeading);
              
              if (turnAngle < -20) {
                turnIcon = Icons.turn_left;
              } else if (turnAngle > 20) {
                turnIcon = Icons.turn_right;
              }
            } else if (polylineCoordinates.length > currentWaypointIndex + 1) {
              final LatLng p0 = polylineCoordinates[currentWaypointIndex];
              final LatLng pEnd = polylineCoordinates.last;
              double bearingToNext = calculateBearing(p0.latitude, p0.longitude, pEnd.latitude, pEnd.longitude);
              double turnAngle = normalizeAngle(bearingToNext - currentHeading);
              if (turnAngle < -20) turnIcon = Icons.turn_left;
              else if (turnAngle > 20) turnIcon = Icons.turn_right;
            }

            final destName = cp['landmarkName'] ?? (selectedEndPlace != null ? selectedEndPlace['name'] : 'Checkpoint');

            arWidgets.add(
              Positioned(
                left: targetX - 120, // Center it roughly (240 width)
                top: targetY - targetSize - 80, // Above the dot
                child: SizedBox(
                  width: 240,
                  child: Center(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.65),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
                            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4))],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(turnIcon, color: const Color(0xFF00FF87), size: 28),
                              const SizedBox(width: 8),
                              Flexible(
                                child: Text(
                                  destName,
                                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }
        }
      }
    }

    final isLastStep = checkpoints.isEmpty || currentWaypointIndex >= checkpoints.length - 1;

    // Add Top Header controls
    arWidgets.add(
      Positioned(
        top: 60,
        left: 20,
        right: 20,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: _finishRoute,
              ),
            ),
            ElevatedButton(
              onPressed: _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: isLastStep ? Colors.green : const Color(0xFF00FF87),
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: Text(isLastStep ? 'Finish' : 'Next Checkpoint', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );

    // Manual Switch to Indoor Mode Button
    if (selectedEndPlace != null &&
        (selectedEndPlace!['requiresIndoorNav'] == true || selectedEndPlace!['requiresIndoorNav'] == 'true') &&
        !hasArrivedAtBuilding) {
      arWidgets.add(
        Positioned(
          top: 120,
          right: 20,
          child: ElevatedButton.icon(
            onPressed: () {
              setState(() {
                hasArrivedAtBuilding = true;
                currentIndoorFloor = _parseFloorLevel(selectedEndPlace!['floorLevel']);
              });
            },
            icon: const Icon(Icons.meeting_room, color: Colors.black),
            label: const Text('Indoor Mode', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00FF87),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
          ),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: arWidgets,
    );
  }

  Widget _buildTypeAheadField(String hint, TextEditingController controller, Function(dynamic) onSelected) {
    return TypeAheadField(
      controller: controller,
      builder: (context, controller, focusNode) {
        return TextField(
          controller: controller,
          focusNode: focusNode,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: Colors.white54),
            border: InputBorder.none,
            icon: const Icon(Icons.search, color: Color(0xFF00FF87)),
            suffixIcon: controller.text.isNotEmpty 
                ? IconButton(icon: const Icon(Icons.clear, color: Colors.white54), onPressed: () => controller.clear()) 
                : null,
          ),
        );
      },
      itemBuilder: (context, dynamic place) {
        return Container(
          color: const Color(0xFF1E1E1E), // Dark Mode Dropdown
          child: ListTile(
            title: Text(place['name'].toString(), style: const TextStyle(color: Colors.white)),
            leading: const Icon(Icons.place, color: Color(0xFF00FF87)),
          ),
        );
      },
      onSelected: (dynamic place) {
        controller.text = place['name'].toString();
        onSelected(place);
      },
      suggestionsCallback: (pattern) => _getSuggestions(pattern),
    );
  }

  Widget _buildIndoorGuideCard() {
    final buildingName = selectedEndPlace != null ? selectedEndPlace['name'] : 'Destination';
    final initialFloorLevel = selectedEndPlace != null ? _parseFloorLevel(selectedEndPlace['floorLevel']) : 0;
    final activeFloorLevel = currentIndoorFloor ?? initialFloorLevel;
    final indoorDirections = selectedEndPlace != null && selectedEndPlace['indoorDirections'] != null && selectedEndPlace['indoorDirections'].toString().isNotEmpty
        ? selectedEndPlace['indoorDirections']
        : 'You have reached your destination.';

    return Container(
      color: Colors.black.withOpacity(0.85),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32.0),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                  boxShadow: const [BoxShadow(color: Colors.black54, blurRadius: 20, offset: Offset(0, 10))],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TweenAnimationBuilder(
                      tween: Tween<double>(begin: 0.8, end: 1.2),
                      duration: const Duration(seconds: 1),
                      builder: (context, double scale, child) {
                        return Transform.scale(
                          scale: scale,
                          child: const Icon(Icons.check_circle_outline, color: Color(0xFF00FF87), size: 72),
                        );
                      },
                      onEnd: () {},
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Arrived at $buildingName',
                      style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    // Live Sync Dropdown
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF00FF87).withOpacity(0.5)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFF00FF87),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            activeFloorLevel == 0 ? 'Ground Floor (Level 0)' : 'Level $activeFloorLevel',
                            style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    IndoorMapView(
                      floorLevel: activeFloorLevel,
                      roomNumber: selectedEndPlace != null && selectedEndPlace['roomNumber'] != null ? selectedEndPlace['roomNumber'].toString() : '',
                    ),
                    const SizedBox(height: 20),
                    if (indoorDirections.isNotEmpty) ...[
                      const Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Indoor Directions:', style: TextStyle(color: Colors.white54, fontSize: 14, fontWeight: FontWeight.w600)),
                      ),
                      const SizedBox(height: 8),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(indoorDirections, style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.5)),
                      ),
                    ],
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _finishRoute,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00FF87),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('Finish Navigation', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
