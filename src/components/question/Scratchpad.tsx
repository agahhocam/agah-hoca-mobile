import { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, GestureResponderEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../constants/Colors';

interface Point { x: number; y: number }

interface ScratchpadProps {
  visible: boolean;
  onToggle: () => void;
}

export function Scratchpad({ visible, onToggle }: ScratchpadProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<Point[]>([]);

  function pointsToSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    const [first, ...rest] = points;
    let d = `M ${first.x} ${first.y}`;
    rest.forEach(p => { d += ` L ${p.x} ${p.y}`; });
    return d;
  }

  function handleTouchStart(e: GestureResponderEvent) {
    const { locationX, locationY } = e.nativeEvent;
    currentPath.current = [{ x: locationX, y: locationY }];
  }

  function handleTouchMove(e: GestureResponderEvent) {
    const { locationX, locationY } = e.nativeEvent;
    currentPath.current.push({ x: locationX, y: locationY });
    // Force re-render for live preview
    setPaths(prev => {
      const next = [...prev];
      next[next.length] = pointsToSvgPath(currentPath.current);
      return next;
    });
  }

  function handleTouchEnd() {
    const d = pointsToSvgPath(currentPath.current);
    if (d) {
      setPaths(prev => {
        const next = prev.filter((_, i) => i < prev.length - 1);
        return [...next, d];
      });
    }
    currentPath.current = [];
  }

  function handleUndo() {
    setPaths(prev => prev.slice(0, -1));
  }

  function handleClear() {
    setPaths([]);
    currentPath.current = [];
  }

  return (
    <>
      {/* Toggle button */}
      <TouchableOpacity style={styles.toggleBtn} onPress={onToggle}>
        <Text style={styles.toggleText}>{visible ? '✏️ Kapat' : '✏️ Karalama'}</Text>
      </TouchableOpacity>

      {visible && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Drawing canvas */}
          <View
            style={StyleSheet.absoluteFill}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
          >
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((d, i) => (
                <Path
                  key={i}
                  d={d}
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.8}
                />
              ))}
            </Svg>
          </View>

          {/* Scratchpad controls */}
          <View style={styles.controls} pointerEvents="box-none">
            <TouchableOpacity style={styles.ctrlBtn} onPress={handleUndo}>
              <Text style={styles.ctrlText}>↩</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.ctrlBtn, styles.clearBtn]} onPress={handleClear}>
              <Text style={styles.ctrlText}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.05)',
    zIndex: 10,
  },
  controls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    pointerEvents: 'box-none',
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearBtn: { backgroundColor: '#FEE2E2' },
  ctrlText: { fontSize: 16 },
});
