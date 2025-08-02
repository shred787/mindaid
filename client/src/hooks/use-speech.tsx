import { useState, useEffect, useRef } from "react";
import { VoiceRecognitionResult } from "@/types";

interface UseSpeechOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: any) => void;
}

export function useSpeech(options: UseSpeechOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    language = "en-US",
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        
        const recognition = recognitionRef.current;
        if (recognition) {
          recognition.continuous = continuous;
          recognition.interimResults = interimResults;
          recognition.lang = language;

          recognition.onresult = (event: any) => {
          let finalTranscript = "";
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;

            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const fullTranscript = finalTranscript || interimTranscript;
          setTranscript(fullTranscript);

          if (onResult) {
            onResult({
              transcript: fullTranscript,
              confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
              isFinal: event.results[event.results.length - 1]?.isFinal || false,
            });
          }
        };

          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
            onError?.(event.error);
          };
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, interimResults, language, onResult, onError]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Text-to-speech functionality
  const speak = (text: string, options: SpeechSynthesisUtteranceOptions = {}) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      Object.assign(utterance, options);
      window.speechSynthesis.speak(utterance);
    }
  };

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    speak,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechSynthesisUtteranceOptions {
  voice?: SpeechSynthesisVoice;
  volume?: number;
  rate?: number;
  pitch?: number;
}
