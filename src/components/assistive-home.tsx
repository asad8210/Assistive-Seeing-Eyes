
"use client";

import { speakText, startSpeechRecognition, type SpeechRecognitionResult } from "@/lib/speech";
import { useToast } from "@/hooks/use-toast";
import { Mic, Camera, Info, Volume2, Activity, Loader2 } from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";

// TensorFlow.js and COCO-SSD model
import * as tf from "@tensorflow/tfjs";
import type * as cocoSsd from "@tensorflow-models/coco-ssd";

// Ensure TFJS backend is set up
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

// Actual Genkit flow imports
import type { PersonalAssistantInput, PersonalAssistantOutput } from "@/ai/flows/personal-assistant";
import type { DescribeDetailedSceneInput, DescribeDetailedSceneOutput } from "@/ai/flows/describe-detailed-scene-flow";


const DOUBLE_TAP_THRESHOLD = 300; // milliseconds
const LONG_PRESS_DURATION = 700; // milliseconds
const SWIPE_THRESHOLD_Y = 50; // Min vertical distance for a swipe
const SWIPE_THRESHOLD_X = 75; // Max horizontal distance for a vertical swipe
const DETECTION_INTERVAL = 3000; // milliseconds for calling describeDetailedScene

// This will be overridden by Render's environment variable for production
const rawApiBaseUrl = process.env.NEXT_PUBLIC_GENKIT_API_BASE_URL;
const GENKIT_API_BASE_URL = (rawApiBaseUrl && String(rawApiBaseUrl).trim()) ? String(rawApiBaseUrl).trim() : 'http://localhost:3400';

if (typeof window !== 'undefined') { // Log only on the client
  console.log('[AssistiveHomePage] Initial NEXT_PUBLIC_GENKIT_API_BASE_URL:', rawApiBaseUrl);
  console.log('[AssistiveHomePage] Using GENKIT_API_BASE_URL:', GENKIT_API_BASE_URL);
}

const AssistiveHomePage: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<string>(
    "Welcome! Double tap for camera, tap & hold for assistant."
  );
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isAssistantActive, setIsAssistantActive] = useState<boolean>(false);
  const [currentObjectDescription, setCurrentObjectDescription] = useState<string>(""); // For on-screen text from COCO-SSD
  const [lastSpokenDetailedDescription, setLastSpokenDetailedDescription] = useState<string>("");
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true); // COCO-SSD model loading
  const [isGeneratingDetailedDescription, setIsGeneratingDetailedDescription] = useState<boolean>(false);
  const [objectDetections, setObjectDetections] = useState<cocoSsd.DetectedObject[]>([]);
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState<boolean>(false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingHoldRef = useRef<boolean>(false);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const mountedRef = useRef(true); // To track component mount state
  const appModeRef = useRef<'idle' | 'camera' | 'assistant'>('idle'); // To help manage states

  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef(0);


  const { toast } = useToast();

  const speakAndSetStatus = useCallback((text: string, isSilent?: boolean) => {
    setStatusMessage(text);
    if (!isSilent && mountedRef.current) {
      setIsCurrentlySpeaking(true);
      speakText(text, () => {
        if (mountedRef.current) setIsCurrentlySpeaking(false);
      });
    }
  }, [setIsCurrentlySpeaking, setStatusMessage]);

  useEffect(() => {
    if (isAssistantActive) appModeRef.current = 'assistant';
    else if (isCameraActive) appModeRef.current = 'camera';
    else appModeRef.current = 'idle';
  }, [isAssistantActive, isCameraActive]);

  useEffect(() => {
    async function loadModel() {
      try {
        await tf.ready();
        const cocoSsdModule = await import('@tensorflow-models/coco-ssd');
        const loadedModel = await cocoSsdModule.load();
        modelRef.current = loadedModel;
        if (mountedRef.current) {
            setIsModelLoading(false);
            speakAndSetStatus("Model loaded. Ready for object detection.", true);
            console.log("COCO-SSD model loaded successfully.");
        }
      } catch (error) {
        console.error("Error loading COCO-SSD model:", error);
        if (mountedRef.current) {
            speakAndSetStatus("Failed to load AI model. Object detection unavailable.");
            toast({ title: "Model Load Error", description: String(error), variant: "destructive" });
            setIsModelLoading(false);
        }
      }
    }
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);


  useEffect(() => {
    const welcomeMessage =
      "Welcome to Assistive Visions. Double tap the screen to identify objects. Tap and hold to speak to your personal assistant.";
    if (!isModelLoading && mountedRef.current) {
        if (!isCurrentlySpeaking && appModeRef.current === 'idle') {
          speakAndSetStatus(welcomeMessage);
        } else {
          setStatusMessage(welcomeMessage);
        }
    } else if (mountedRef.current) {
        setStatusMessage("Loading AI model for object detection...");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModelLoading]); 


  const drawBoundingBoxes = useCallback((predictions: cocoSsd.DetectedObject[]) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !canvas.getContext) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const scaleX = video.clientWidth / video.videoWidth;
    const scaleY = video.clientHeight / video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    predictions.forEach(prediction => {
      const [x, y, width, height] = prediction.bbox;
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      const label = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;
      ctx.strokeStyle = "#00FFFF"; // Cyan for bounding boxes
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      ctx.fillStyle = "#00FFFF";
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(scaledX, scaledY, textWidth + 4, 18);
      ctx.fillStyle = "#000000"; // Black text for label
      ctx.fillText(label, scaledX + 2, scaledY + 2);
    });
  }, []);


  const detectAndDescribeObjects = useCallback(async () => {
    if (!mountedRef.current || !modelRef.current || !videoRef.current || !canvasRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        return;
    }

    const videoElement = videoRef.current;
    if (videoElement.paused) {
        try { await videoElement.play(); } catch (e) { console.warn("Could not resume paused video for detection:", e); return; }
    }

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        console.warn("Video dimensions are zero during detection attempt.");
        return;
    }

    try {
        const predictions = await modelRef.current.detect(videoElement);
        if (mountedRef.current) {
            setObjectDetections(predictions);
            drawBoundingBoxes(predictions);

            if (predictions.length > 0) {
                const distinctObjects = [...new Set(predictions.map(p => p.class))];
                const cocoDescription = "I see " + distinctObjects.slice(0, 3).join(", ") + ".";
                setCurrentObjectDescription(cocoDescription);
            } else {
                setCurrentObjectDescription("No objects detected by local model.");
            }
        }
    } catch (cocoError) {
        console.error("Error during COCO-SSD object detection:", cocoError);
        if (mountedRef.current) setCurrentObjectDescription("Error in local object detection.");
    }

    if (!isGeneratingDetailedDescription && videoRef.current && mountedRef.current && appModeRef.current === 'camera') {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoElement.videoWidth;
        tempCanvas.height = videoElement.videoHeight;
        const tempCtx = tempCanvas.getContext('2d');

        if (tempCtx) {
            tempCtx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
            const frameDataUri = tempCanvas.toDataURL('image/jpeg', 0.8);

            if (frameDataUri) {
                setIsGeneratingDetailedDescription(true);
                try {
                    const flowInput: DescribeDetailedSceneInput = {
                        photoDataUri: frameDataUri,
                        previousDetailedDescription: lastSpokenDetailedDescription || undefined,
                    };

                    const fullFetchUrl = `${GENKIT_API_BASE_URL}/api/flow/describeDetailedSceneFlow`;
                    console.log(`[detectAndDescribeObjects] Attempting to fetch: ${fullFetchUrl}`); 
                    const response = await fetch(fullFetchUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(flowInput),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                        throw new Error(errorData.message || `HTTP error ${response.status}`);
                    }
                    const output: DescribeDetailedSceneOutput = await response.json();

                    if (mountedRef.current && appModeRef.current === 'camera') {
                        if (output.detailedDescription && output.detailedDescription.trim() !== "" && output.detailedDescription !== lastSpokenDetailedDescription) {
                            setLastSpokenDetailedDescription(output.detailedDescription);
                            setIsCurrentlySpeaking(true);
                            speakText(output.detailedDescription, () => {
                                if (mountedRef.current) setIsCurrentlySpeaking(false);
                            });
                        }
                    }
                } catch (flowError: any) {
                    console.error("[detectAndDescribeObjects] Error calling describeDetailedSceneFlow:", flowError);
                    let userErrorMessage = "Sorry, I couldn't get a detailed description.";
                    if (flowError.name === 'TypeError' && flowError.message.toLowerCase().includes('failed to fetch')) {
                        userErrorMessage = "Unable to connect to the description service. Please check your internet connection or try again later.";
                        console.error('[detectAndDescribeObjects] A "Failed to fetch" error occurred for describeDetailedSceneFlow. This might indicate network issues, the Genkit server is down/unreachable, or an incorrect API endpoint/proxy setup.');
                        console.error('[detectAndDescribeObjects] Resolved GENKIT_API_BASE_URL for this fetch:', GENKIT_API_BASE_URL);
                        console.error('[detectAndDescribeObjects] Full fetch URL attempted was:', `${GENKIT_API_BASE_URL}/api/flow/describeDetailedSceneFlow`);
                    } else if (flowError.message) {
                        userErrorMessage = `Error: ${flowError.message.substring(0,150)}`;
                    }

                    if (mountedRef.current && appModeRef.current === 'camera') {
                        setIsCurrentlySpeaking(true);
                        speakText(userErrorMessage, () => {
                           if (mountedRef.current) setIsCurrentlySpeaking(false);
                        });
                        toast({ title: "Description Service Error", description: userErrorMessage, variant: "destructive"});
                    }
                } finally {
                    if (mountedRef.current) setIsGeneratingDetailedDescription(false);
                }
            }
        }
    }
  }, [drawBoundingBoxes, isGeneratingDetailedDescription, lastSpokenDetailedDescription, toast, setIsCurrentlySpeaking, setCurrentObjectDescription, setLastSpokenDetailedDescription]);


  const stopCamera = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if(mountedRef.current) setIsCurrentlySpeaking(false);
    }
    if (mountedRef.current) {
        setIsCameraActive(false);
        const canvas = canvasRef.current;
        if (canvas && canvas.getContext('2d')) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setObjectDetections([]);
        if (appModeRef.current !== 'assistant') {
            speakAndSetStatus("Camera off. Double tap for camera, tap & hold for assistant.");
        }
        setCurrentObjectDescription("");
        setLastSpokenDetailedDescription("");
        setIsGeneratingDetailedDescription(false);
    }
  }, [speakAndSetStatus, setIsCameraActive, setIsCurrentlySpeaking, setCurrentObjectDescription, setLastSpokenDetailedDescription, setIsGeneratingDetailedDescription]);

  const startCamera = useCallback(async () => {
    if (isModelLoading) {
        speakAndSetStatus("AI Model is still loading. Please wait.");
        toast({title: "Model Loading", description: "Please wait for the AI model to finish loading before starting the camera."});
        return;
    }
    if (!modelRef.current) {
        speakAndSetStatus("AI Model not loaded. Object detection unavailable.");
        toast({title: "Error", description: "AI Model for object detection is not available.", variant: "destructive"});
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      speakAndSetStatus("Camera not supported on this device.");
      toast({ title: "Error", description: "Camera not supported.", variant: "destructive" });
      return;
    }

    if (isCameraActive) return;

    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    detectionIntervalRef.current = null;
    if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }

    try {
      if (mountedRef.current) speakAndSetStatus("Initializing camera...", true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });

      if (videoRef.current && mountedRef.current) {
        const videoElement = videoRef.current;
        videoElement.srcObject = stream;

        let canPlaySetupDone = false;

        const canPlayTimeoutId = setTimeout(() => {
            videoElement.removeEventListener("canplay", handleCanPlayAsync);
            if (!canPlaySetupDone && mountedRef.current) {
                 console.warn("Camera 'canplay' event timed out.");
                 speakAndSetStatus("Camera timed out. Please try again.");
                 toast({ title: "Camera Error", description: "Timeout waiting for video data.", variant: "destructive" });
                 stream.getTracks().forEach((track) => track.stop());
                 if (videoRef.current) videoRef.current.srcObject = null;
                 if(mountedRef.current) setIsCameraActive(false);
            }
        }, 10000);

        const handleCanPlayAsync = async () => {
          clearTimeout(canPlayTimeoutId);
          if (canPlaySetupDone || !mountedRef.current || !videoRef.current || videoRef.current.srcObject !== stream) {
            if (videoRef.current && videoRef.current.srcObject !== stream && stream.active) {
                stream.getTracks().forEach(track => track.stop());
            }
            return;
          }
          canPlaySetupDone = true;

          try {
            await videoElement.play();
             if (!mountedRef.current) {  stream.getTracks().forEach(track => track.stop()); return; }
            if(mountedRef.current) setIsCameraActive(true);
            speakAndSetStatus("Camera active. Point to objects. Double tap to stop.");

            // Perform an initial detection immediately
            await detectAndDescribeObjects();

            // Then set up the interval
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = setInterval(detectAndDescribeObjects, DETECTION_INTERVAL);

          } catch (playError) {
            console.error("Video play error:", playError);
            if (mountedRef.current) {
                speakAndSetStatus("Could not start camera video.");
                toast({ title: "Camera Playback Error", description: String(playError), variant: "destructive" });
                if(mountedRef.current) setIsCameraActive(false);
            }
            stream.getTracks().forEach((track) => track.stop());
            if (videoRef.current) videoRef.current.srcObject = null;
          }
        };

        videoElement.addEventListener("canplay", handleCanPlayAsync, { once: true });
        videoElement.load(); // Some browsers need load() to be called

      } else {
         // Component unmounted or videoRef not available while stream was being acquired
         stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err: any) {
      console.error("Error accessing camera (getUserMedia):", err);
      let userMessage = "Could not access camera. Please check permissions.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userMessage = "Camera permission denied. Please enable it in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userMessage = "No camera found. Ensure a camera is connected and enabled.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        userMessage = "Camera is already in use or a hardware error occurred.";
      } else if (err.name === "OverconstrainedError" || err.name === "ConstraintNotSatisfiedError"){
        userMessage = "No camera found that meets the requirements (e.g. facing mode).";
      } else if (err.name === "TypeError"){
         userMessage = "Camera features not correctly specified or an issue with device enumeration.";
      }
      if (mountedRef.current) {
        speakAndSetStatus(userMessage);
        toast({ title: "Camera Access Error", description: err.message || userMessage, variant: "destructive" });
        if(mountedRef.current) setIsCameraActive(false);
      }
    }
  }, [speakAndSetStatus, toast, detectAndDescribeObjects, isCameraActive, setIsCameraActive, isModelLoading]);


  const toggleObjectDetection = useCallback(() => {
    if (isProcessingHoldRef.current) return;
    if (appModeRef.current === 'assistant') {
        speakAndSetStatus("Please stop the assistant first before using the camera.");
        return;
    }
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  }, [isCameraActive, startCamera, stopCamera, speakAndSetStatus]);


  const stopPersonalAssistant = useCallback(() => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop(); 
      speechRecognitionRef.current = null;
    }
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if(mountedRef.current) setIsCurrentlySpeaking(false);
    }
    if (mountedRef.current) {
        setIsAssistantActive(false);
        if (appModeRef.current !== 'camera') {
            speakAndSetStatus("Assistant off. Double tap for camera, tap & hold for assistant.");
        }
    }
  }, [speakAndSetStatus, setIsAssistantActive, setIsCurrentlySpeaking]);

  const startPersonalAssistant = useCallback(() => {
    if (appModeRef.current === 'camera') {
        speakAndSetStatus("Please stop the camera first before using the assistant.");
        return;
    }
    if (mountedRef.current) setIsAssistantActive(true);

    setStatusMessage("Listening..."); 
    setIsCurrentlySpeaking(true);
    speakText("Listening...", () => { 
       if(mountedRef.current) setIsCurrentlySpeaking(false);
        if (mountedRef.current && speechRecognitionRef.current && isAssistantActive) { 
            speechRecognitionRef.current?.start();
        }
    });


    speechRecognitionRef.current = startSpeechRecognition(
      async (result: SpeechRecognitionResult) => {
        if (result.isFinal) {
          if (!mountedRef.current || appModeRef.current !== 'assistant') return; 
          setStatusMessage("Processing your request...");
          try {
            let locationString: string | undefined;
            try {
              const position = await new Promise<GeolocationPosition>((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true })
              );
              locationString = `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
            } catch (geoError: any) {
              console.warn("Could not get location:", geoError);
            }

            const assistantInput: PersonalAssistantInput = { speech: result.transcript, location: locationString };
            const fullFetchUrl = `${GENKIT_API_BASE_URL}/api/flow/personalAssistantFlow`;
            console.log(`[startPersonalAssistant] Attempting to fetch: ${fullFetchUrl}`); 
            const response = await fetch(fullFetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assistantInput),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
                throw new Error(errorData.message || `HTTP error ${response.status}`);
            }
            const assistantOutput: PersonalAssistantOutput = await response.json();

            if (!mountedRef.current || appModeRef.current !== 'assistant') return; 

            setStatusMessage(assistantOutput.response); 
            setIsCurrentlySpeaking(true);
            speakText(assistantOutput.response, () => { 
              if (mountedRef.current) setIsCurrentlySpeaking(false);
              if (mountedRef.current && speechRecognitionRef.current && isAssistantActive) {
                 setStatusMessage("Listening..."); 
                 speechRecognitionRef.current?.start();
              } else if (!isAssistantActive && mountedRef.current) {
                 stopPersonalAssistant();
              }
            });

          } catch (apiError: any) {
            console.error("[startPersonalAssistant] Personal assistant API error:", apiError);
            let userErrorMessage = "Sorry, I couldn't process that. Please try again.";

            if (apiError.name === 'TypeError' && apiError.message.toLowerCase().includes('failed to fetch')) {
                userErrorMessage = "Unable to connect to the assistant service. Please check your internet connection or try again later.";
                console.error('[startPersonalAssistant] A "Failed to fetch" error occurred for personalAssistantFlow. This might indicate network issues, the Genkit server is down/unreachable, or an incorrect API endpoint/proxy setup.');
                console.error('[startPersonalAssistant] Resolved GENKIT_API_BASE_URL for this fetch:', GENKIT_API_BASE_URL);
                console.error('[startPersonalAssistant] Full fetch URL attempted was:', `${GENKIT_API_BASE_URL}/api/flow/personalAssistantFlow`);
            } else if (apiError.message) {
                userErrorMessage = `Assistant Error: ${apiError.message.substring(0,150)}`;
            }

            if (!mountedRef.current || appModeRef.current !== 'assistant') return; 

            setStatusMessage(userErrorMessage); 
            setIsCurrentlySpeaking(true);
            toast({ title: "Assistant Service Error", description: userErrorMessage, variant: "destructive" });
            speakText(userErrorMessage, () => { 
                if(mountedRef.current) setIsCurrentlySpeaking(false);
                if (mountedRef.current && speechRecognitionRef.current && isAssistantActive) {
                   setStatusMessage("Listening..."); 
                   speechRecognitionRef.current?.start();
                }
            });
          }
        } else {
          if (mountedRef.current && appModeRef.current === 'assistant') setStatusMessage(`Heard: "${result.transcript}"...`);
        }
      },
      (error) => { 
        if (!mountedRef.current) return;
        console.error("Speech recognition error:", error);
        let errorMsgText = `Speech recognition error: ${error}.`;
        let shouldStopAndSpeak = false;
        let messageForUser = "";

        if (error === "no-speech" && isAssistantActive) {
            messageForUser = "Didn't catch that. Tap and hold to try again or just speak.";
        } else if (error === "audio-capture") {
            messageForUser = "No microphone found or microphone is not working. Please check your microphone.";
            shouldStopAndSpeak = true; 
        } else if (error === "not-allowed" || error === "service-not-allowed") {
            messageForUser = "Microphone permission denied. Please enable it in browser settings.";
            shouldStopAndSpeak = true;
        } else if (error === "network") {
            messageForUser = "Network error during speech recognition. Please check your connection.";
        }
        
        if (shouldStopAndSpeak) {
            stopPersonalAssistant(); 
            speakAndSetStatus(messageForUser || errorMsgText, false); 
            return; 
        }

        if (isAssistantActive && mountedRef.current) {
            const fullErrorToSpeak = (messageForUser || errorMsgText) + (error === "no-speech" ? "" : " Let me try listening again.");
            setStatusMessage(fullErrorToSpeak); 
            setIsCurrentlySpeaking(true);
            speakText(fullErrorToSpeak, () => { 
                if (mountedRef.current) setIsCurrentlySpeaking(false);
                if (mountedRef.current && speechRecognitionRef.current && isAssistantActive) { 
                    setStatusMessage("Listening..."); 
                    speechRecognitionRef.current?.start(); 
                } else if (mountedRef.current) { 
                    stopPersonalAssistant();
                }
            });
        }
      },
      () => { 
        // console.log("Speech recognition ended.");
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ speakAndSetStatus, toast, isAssistantActive, stopPersonalAssistant]);


  const togglePersonalAssistant = useCallback(() => {
    if (isAssistantActive) {
      stopPersonalAssistant();
    } else {
      startPersonalAssistant();
    }
  }, [isAssistantActive, startPersonalAssistant, stopPersonalAssistant]);

  const handleDoubleClick = useCallback(() => {
    if (isProcessingHoldRef.current) return;
    toggleObjectDetection();
  }, [toggleObjectDetection]);

  const handlePointerDown = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    isProcessingHoldRef.current = false; 
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);

    if ('touches' in event && event.touches.length > 0) {
        touchStartXRef.current = event.touches[0].clientX;
        touchStartYRef.current = event.touches[0].clientY;
    } else if ('clientX' in event) { 
        touchStartXRef.current = event.clientX;
        touchStartYRef.current = event.clientY;
    }


    holdTimeoutRef.current = setTimeout(() => {
      if (holdTimeoutRef.current) { 
        isProcessingHoldRef.current = true; 
        togglePersonalAssistant();
      }
      holdTimeoutRef.current = null; 
      lastTapTimeRef.current = 0; 
    }, LONG_PRESS_DURATION);
  }, [togglePersonalAssistant]);

  const handleTapOrClick = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD) {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current); 
        holdTimeoutRef.current = null;
      }
      handleDoubleClick();
      lastTapTimeRef.current = 0; 
    } else {
      lastTapTimeRef.current = now;
      if (appModeRef.current === 'assistant' && isCurrentlySpeaking) {
          window.speechSynthesis.cancel();
          setIsCurrentlySpeaking(false); 
          if (mountedRef.current && speechRecognitionRef.current && isAssistantActive) {
              setStatusMessage("Listening...");
              speechRecognitionRef.current.start();
          }
      }
    }
  }, [handleDoubleClick, isCurrentlySpeaking, setIsCurrentlySpeaking, setStatusMessage, isAssistantActive]);


  const handlePointerUp = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    let wasSwipeInterrupt = false;

    if (event && 'changedTouches' in event && event.changedTouches.length > 0 && touchStartYRef.current !== null && touchStartXRef.current !== null) {
        const touchEndY = event.changedTouches[0].clientY;
        const touchEndX = event.changedTouches[0].clientX;

        if (
          isCurrentlySpeaking && 
          appModeRef.current === 'assistant' && 
          isAssistantActive && 
          touchStartYRef.current - touchEndY > SWIPE_THRESHOLD_Y && 
          Math.abs(touchEndX - touchStartXRef.current) < SWIPE_THRESHOLD_X 
        ) {
          wasSwipeInterrupt = true;
          window.speechSynthesis.cancel(); 
          setIsCurrentlySpeaking(false); 

          if (mountedRef.current && speechRecognitionRef.current && isAssistantActive) {
            setStatusMessage("Listening...");
            speechRecognitionRef.current.start();
          }
        }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (wasSwipeInterrupt) {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
        holdTimeoutRef.current = null;
      }
      isProcessingHoldRef.current = false; 
      return; 
    }

    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
      if (!isProcessingHoldRef.current) {
         handleTapOrClick();
      }
    }
    isProcessingHoldRef.current = false;
  }, [isCurrentlySpeaking, isAssistantActive, setIsCurrentlySpeaking, setStatusMessage, handleTapOrClick]);


  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (speechRecognitionRef.current) speechRecognitionRef.current.abort(); 
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (modelRef.current && typeof (modelRef.current as any).dispose === 'function') {
        (modelRef.current as any).dispose();
        console.log("COCO-SSD model disposed.");
      }
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && appModeRef.current === 'camera' && !isGeneratingDetailedDescription && !isCurrentlySpeaking) {
      if (!detectionIntervalRef.current) { 
        detectAndDescribeObjects(); 
        detectionIntervalRef.current = setInterval(detectAndDescribeObjects, DETECTION_INTERVAL); 
      }
    } else {
      if (detectionIntervalRef.current) { 
        clearInterval(detectionIntervalRef.current); 
        detectionIntervalRef.current = null;
      }
    }
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraActive, isGeneratingDetailedDescription, isCurrentlySpeaking, detectAndDescribeObjects]); 


  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen w-full bg-background text-foreground p-4 touch-manipulation select-none relative overflow-hidden"
      onMouseDown={handlePointerDown} 
      onMouseUp={handlePointerUp}     
      onTouchStart={(e) => { handlePointerDown(e as any); }}
      onTouchEnd={(e) => { handlePointerUp(e as any); }}
      aria-label="Assistive Visions Interactive Area"
      role="application"
      tabIndex={0} 
    >
      <video
        ref={videoRef}
        className={`absolute top-0 left-0 w-full h-full object-cover z-0 ${isCameraActive ? 'block' : 'hidden'}`}
        autoPlay
        playsInline 
        muted     
        aria-hidden={!isCameraActive} 
        aria-label="Live camera feed for object detection"
      />
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full object-cover z-[5] ${isCameraActive && objectDetections.length > 0 ? 'block' : 'hidden'}`}
        aria-hidden="true" 
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 pointer-events-none"> 
        <div
          className="text-center bg-black/70 p-4 rounded-lg shadow-xl max-w-md backdrop-blur-sm" 
          aria-live="assertive" 
          aria-atomic="true"
        >
            {isModelLoading ? (
                <div className="flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin mr-2 text-primary" />
                    <p className="text-xl font-semibold">Loading AI model...</p>
                </div>
            ) : (
                 isGeneratingDetailedDescription && isCameraActive ? ( 
                    <div className="flex items-center justify-center">
                        <Loader2 size={28} className="animate-spin mr-2 text-accent" />
                        <p className="text-xl font-semibold">Analyzing scene details...</p>
                    </div>
                ) : ( 
                    <p className="text-2xl font-semibold mb-2">{statusMessage}</p>
                )
            )}
          {isCameraActive && currentObjectDescription && !isModelLoading && !isGeneratingDetailedDescription && (
            <p className="text-xl mt-2 italic">"{currentObjectDescription}"</p>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-4 pointer-events-none">
        {isCameraActive && !isGeneratingDetailedDescription && <Camera size={32} className="text-accent animate-pulse" />}
        {isCameraActive && isGeneratingDetailedDescription && <Loader2 size={32} className="text-accent animate-spin" />}
        {isAssistantActive && <Mic size={32} className="text-accent animate-pulse" />}
        {!isCameraActive && !isAssistantActive && !isModelLoading && <Info size={32} className="opacity-70" />} 
         {isModelLoading && <Loader2 size={32} className="animate-spin text-primary" />} 
      </div>

      <div className="absolute top-6 right-6 z-20 pointer-events-none">
         {isCurrentlySpeaking &&  <Volume2 size={28} className="text-accent animate-pulse" />}
         {!isCurrentlySpeaking &&  <Volume2 size={28} className="text-accent opacity-50" />}
      </div>
       {(isCameraActive || isAssistantActive) && (
         <div className="absolute top-6 left-6 z-20 pointer-events-none">
           <Activity size={28} className="text-primary animate-ping opacity-75" />
           <Activity size={28} className="text-primary absolute top-0 left-0" />
         </div>
       )}
    </div>
  );
};

export default AssistiveHomePage;

    
