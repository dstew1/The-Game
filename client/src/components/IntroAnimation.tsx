/**
 * IntroAnimation Component
 * 
 * A React component that displays an animated welcome message with synchronized sound effects
 * using the Web Audio API. This component is typically shown when users first log in or
 * during significant transitions in the application.
 *
 * @component
 * 
 * Features:
 * - Animated text reveal with staggered letter animations
 * - Synchronized power-up and success sound effects
 * - Automatic cleanup of audio resources
 * - Customizable completion callback
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Callback function called when animation completes
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroAnimationProps {
  onComplete: () => void;
}

// Singleton AudioContext instance for sound generation
let audioContext: AudioContext | null = null;

/**
 * Creates and plays a power-up sound effect using Web Audio API
 * Combines sawtooth and sine wave oscillators with amplitude modulation
 */
function createPowerUpSound() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  const oscillator1 = audioContext.createOscillator();
  const oscillator2 = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Configure first oscillator (sawtooth wave)
  oscillator1.frequency.setValueAtTime(30, audioContext.currentTime);
  oscillator1.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.7);
  oscillator1.type = 'sawtooth';

  // Configure second oscillator (sine wave)
  oscillator2.frequency.setValueAtTime(60, audioContext.currentTime);
  oscillator2.frequency.exponentialRampToValueAtTime(240, audioContext.currentTime + 0.7);
  oscillator2.type = 'sine';

  // Configure amplitude envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0.075, audioContext.currentTime + 0.7);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);

  // Schedule oscillator playback
  oscillator1.start(audioContext.currentTime);
  oscillator2.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.8);
  oscillator2.stop(audioContext.currentTime + 0.8);
}

/**
 * Creates and plays a success chord using Web Audio API
 * Generates a three-note chord using sine wave oscillators
 * @returns {Object} Object containing oscillators and gain node for cleanup
 */
function createSuccessChord() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  // Frequencies for a pleasant chord (in Hz)
  const frequencies = [55, 69.30, 82.41];
  const oscillators = frequencies.map(() => audioContext.createOscillator());
  const gainNode = audioContext.createGain();

  oscillators.forEach(osc => osc.connect(gainNode));
  gainNode.connect(audioContext.destination);

  // Configure oscillators
  oscillators.forEach((osc, i) => {
    osc.frequency.setValueAtTime(frequencies[i], audioContext.currentTime);
    osc.type = 'sine';
  });

  // Configure amplitude envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.3);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

  oscillators.forEach(osc => osc.start(audioContext.currentTime));
  return { oscillators, gainNode };
}

export default function IntroAnimation({ onComplete }: IntroAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Trigger completion callback when animation ends
  useEffect(() => {
    if (!isVisible) {
      onComplete();
    }
  }, [isVisible, onComplete]);

  // Handle sound effects
  useEffect(() => {
    if (!isVisible) return;

    let chord: { oscillators: OscillatorNode[], gainNode: GainNode } | null = null;

    try {
      // Resume AudioContext if it was suspended
      if (audioContext?.state === 'suspended') {
        audioContext.resume();
      }

      createPowerUpSound();

      // Play success chord after power-up sound
      const chordTimeout = setTimeout(() => {
        chord = createSuccessChord();
      }, 800);

      // Cleanup function
      return () => {
        clearTimeout(chordTimeout);
        if (chord) {
          chord.oscillators.forEach(osc => osc.stop());
          chord.gainNode.disconnect();
        }
      };
    } catch (error) {
      console.error("Error playing sounds:", error);
    }
  }, [isVisible]);

  // Handle animation timing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const text = "Welcome to The Game";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black z-50"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
              },
            },
            exit: {
              opacity: 0,
              transition: {
                duration: 0.5,
              },
            },
          }}
        >
          <motion.div className="flex gap-2 flex-wrap justify-center">
            {text.split(" ").map((word, wordIndex) => (
              <div key={wordIndex} className="flex">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={letterIndex}
                    className="text-6xl font-bold text-primary"
                    variants={{
                      hidden: { 
                        opacity: 0,
                        y: 20,
                      },
                      visible: {
                        opacity: [0, 1, 0.8, 1],
                        y: 0,
                        transition: {
                          duration: 0.6,
                          repeat: 2,
                          repeatType: "reverse" as const,
                        },
                      },
                    }}
                    style={{
                      textShadow: "0 0 5px currentColor",
                    }}
                  >
                    {letter}
                  </motion.span>
                ))}
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}