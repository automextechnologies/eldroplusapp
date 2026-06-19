import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ConfettiEffect({ trigger }) {
  useEffect(() => {
    if (!trigger) return;
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { x: 0.5, y: 0.5 },
      colors: ['#16a34a', '#9333ea', '#0284c7', '#ea580c', '#4f46e5'],
    });
  }, [trigger]);

  return null;
}
