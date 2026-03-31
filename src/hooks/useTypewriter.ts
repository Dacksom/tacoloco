import { useState, useEffect } from 'react';

export function useTypewriter(texts: string[], speed = 100, pause = 2500) {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  useEffect(() => {
    const i = loopNum % texts.length;
    const fullText = texts[i];

    const currentSpeed = isDeleting ? speed / 2 : speed;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(fullText.substring(0, displayText.length + 1));
        if (displayText === fullText) {
          setTimeout(() => setIsDeleting(true), pause);
        }
      } else {
        setDisplayText(fullText.substring(0, displayText.length - 1));
        if (displayText === '') {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
        }
      }
    }, currentSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, texts, loopNum, speed, pause]);

  return displayText;
}
