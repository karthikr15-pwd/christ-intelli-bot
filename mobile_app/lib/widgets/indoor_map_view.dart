import 'package:flutter/material.dart';

class IndoorMapView extends StatelessWidget {
  final int floorLevel;
  final String roomNumber;

  const IndoorMapView({
    super.key,
    required this.floorLevel,
    required this.roomNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 380,
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E24), // Dark slate/navy background
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white24, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.5),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Stack(
        children: [
          // The dynamic 2D grid and path painter
          CustomPaint(
            size: const Size(double.infinity, 380),
            painter: _IndoorMapPainter(
              floorLevel: floorLevel,
              roomNumber: roomNumber,
            ),
          ),

          // Elevator Icon overlay (Bottom Center)
          const Positioned(
            left: 0,
            right: 0,
            bottom: 30,
            child: Center(
              child: Icon(Icons.elevator, color: Colors.white54, size: 28),
            ),
          ),
        ],
      ),
    );
  }
}

class _IndoorMapPainter extends CustomPainter {
  final int floorLevel;
  final String roomNumber;

  _IndoorMapPainter({required this.floorLevel, required this.roomNumber});

  @override
  void paint(Canvas canvas, Size size) {
    // Fixed to exactly 5 floors (0 = Ground to 5 = Level 5) -> 6 floors total
    final int totalFloors = 5;
    final double floorHeight = size.height / 6;
    final double shaftWidth = 70.0;
    final double centerX = size.width / 2;

    final Paint gridPaint = Paint()
      ..color = Colors.white.withOpacity(0.15)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final Paint shaftPaint = Paint()
      ..color = Colors.grey.withOpacity(0.08)
      ..style = PaintingStyle.fill;

    // Highlight the active floor with a subtle neon green glow
    final double activeFloorY = size.height - (floorLevel * floorHeight);
    final Paint activeFloorGlow = Paint()
      ..color = const Color(0xFF00FF87).withOpacity(0.06)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTRB(0, activeFloorY - floorHeight, size.width, activeFloorY),
      activeFloorGlow,
    );

    // Draw Horizontal Floors
    for (int i = 0; i <= 6; i++) {
      final double y = size.height - (i * floorHeight);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
      
      // Floor Labels
      if (i < 6) {
        final bool isActive = i == floorLevel;
        final TextPainter tp = TextPainter(
          text: TextSpan(
            text: i == 0 ? 'GROUND' : 'LEVEL $i',
            style: TextStyle(
              color: isActive ? const Color(0xFF00FF87) : Colors.white38,
              fontSize: isActive ? 12 : 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
            ),
          ),
          textDirection: TextDirection.ltr,
        );
        tp.layout();
        tp.paint(canvas, Offset(16, size.height - (i * floorHeight) - floorHeight + 10));
      }
    }

    // Draw Vertical Elevator Shaft
    canvas.drawRect(
      Rect.fromCenter(center: Offset(centerX, size.height / 2), width: shaftWidth, height: size.height),
      shaftPaint,
    );
    canvas.drawLine(Offset(centerX - shaftWidth / 2, 0), Offset(centerX - shaftWidth / 2, size.height), gridPaint);
    canvas.drawLine(Offset(centerX + shaftWidth / 2, 0), Offset(centerX + shaftWidth / 2, size.height), gridPaint);

    // Dynamic Routing Math
    final double startX = 34; // Entry X
    final double groundY = size.height - (floorHeight / 2); // Middle of ground floor
    final double targetY = size.height - (floorLevel * floorHeight) - (floorHeight / 2); // Middle of target floor
    final double targetX = size.width - 40; // Destination Room X

    // Build the Orthogonal Path
    final Path routePath = Path();
    routePath.moveTo(startX, groundY);
    routePath.lineTo(centerX, groundY); // Walk to elevator
    routePath.lineTo(centerX, targetY); // Go up elevator shaft
    routePath.lineTo(targetX, targetY); // Walk to room

    // Path Glow
    final Paint glowPaint = Paint()
      ..color = const Color(0xFF00FF87).withOpacity(0.3)
      ..strokeWidth = 14
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    // Path Core
    final Paint pathPaint = Paint()
      ..color = const Color(0xFF00FF87)
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    canvas.drawPath(routePath, glowPaint);
    canvas.drawPath(routePath, pathPaint);

    // Destination Node Circle
    final Paint destPaint = Paint()
      ..color = const Color(0xFF00FF87)
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(Offset(targetX, targetY), 12, glowPaint);
    canvas.drawCircle(Offset(targetX, targetY), 6, destPaint);

    // Destination Room Pill
    final String displayName = roomNumber.isNotEmpty ? roomNumber : 'Target';
    final TextPainter roomTp = TextPainter(
      text: TextSpan(
        text: displayName.toUpperCase(),
        style: const TextStyle(color: Colors.black, fontSize: 13, fontWeight: FontWeight.bold),
      ),
      textDirection: TextDirection.ltr,
    );
    roomTp.layout();
    
    final double pillWidth = roomTp.width + 24;
    final double pillHeight = roomTp.height + 12;
    // Position pill right above the target node
    final RRect pillRect = RRect.fromRectAndRadius(
      Rect.fromCenter(center: Offset(targetX - 20, targetY - 26), width: pillWidth, height: pillHeight),
      const Radius.circular(16),
    );
    
    // Draw white background pill
    canvas.drawRRect(pillRect, Paint()..color = Colors.white);
    roomTp.paint(canvas, Offset(targetX - 20 - roomTp.width / 2, targetY - 26 - roomTp.height / 2));
  }

  @override
  bool shouldRepaint(covariant _IndoorMapPainter oldDelegate) {
    return oldDelegate.floorLevel != floorLevel || oldDelegate.roomNumber != roomNumber;
  }
}
