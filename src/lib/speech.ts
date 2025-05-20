"use client";

export function speakText(text: string, onEnd?: () => void): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    if (onEnd) {
      utterance.onend = onEnd;
    }
    // Cancel any ongoing speech before starting new one
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Speech synthesis not supported in this browser.");
    // Fallback or alert if necessary
    if (onEnd) onEnd(); // Call onEnd even if speech not supported to maintain flow
  }
}

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function startSpeechRecognition(
  onResult: (result: SpeechRecognitionResult) => void,
  onError: (error: any) => void,
  onEnd?: () => void
): SpeechRecognitionResult | null {
  if (typeof window !== "undefined") {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Process single utterances
      recognition.interimResults = true; // Get interim results
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          onResult({ transcript: finalTranscript, isFinal: true });
        } else if (interimTranscript) {
          onResult({ transcript: interimTranscript, isFinal: false });
        }
      };

      recognition.onerror = (event: any) => {
        onError(event.error);
      };

      recognition.onend = () => {
        if (onEnd) {
          onEnd();
        }
      };

      recognition.start();
      return recognition;
    } else {
      onError("Speech recognition not supported in this browser.");
    }
  } else {
    onError("Speech recognition not supported (not in browser environment).");
  }
  return null;
}
