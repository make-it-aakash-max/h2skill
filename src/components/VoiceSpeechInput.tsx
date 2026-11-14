import { Mic, MicOff, AlertCircle, Sparkles, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VoiceSpeechInputProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'es-ES', label: 'Español (Spanish)' },
  { code: 'fr-FR', label: 'Français (French)' },
  { code: 'de-DE', label: 'Deutsch (German)' },
  { code: 'ja-JP', label: '日本語 (Japanese)' },
];

// Preset voice prompts in Tamil and English for quick dictation & testing when mic hardware/permission is limited
const PRESET_VOICE_PROMPTS: Record<string, string[]> = {
  'ta-IN': [
    'எனக்கு பைதான் நிரலாக்க கற்றல் பாதை உருவாக்கு',
    'தரவு அறிவியல் திறன்களில் என் இடைவெளிகள் என்ன?',
    'செயற்கை நுண்ணறிவு மற்றும் இயந்திர கற்றல் எப்படி தொடங்குவது?',
    'முழுமையான வலை மேம்பாட்டு வழிகாட்டி தா',
  ],
  'en-US': [
    'Build me a personalized Python learning path',
    'What are my missing data science competencies?',
    'How do I start with Artificial Intelligence and LLMs?',
    'Create a full-stack web development roadmap',
  ],
  'hi-IN': [
    'मुझे पायथन सीखने का रास्ता चाहिए',
    'डेटा साइंस में मेरे कौन से कौशल छूट रहे हैं?',
  ],
};

export function VoiceSpeechInput({ onTranscript, disabled }: VoiceSpeechInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('ta-IN');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleListen = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setShowSimulator(true);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript;
        if (text) {
          onTranscript(text);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const errType = event.error;
        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setErrorMessage('Microphone permission blocked. Please allow mic access in browser settings or use Quick Voice Helper below.');
          setShowSimulator(true);
        } else if (errType === 'no-speech') {
          setErrorMessage('No speech detected. Please speak clearly into your microphone.');
        } else {
          setErrorMessage(`Speech recognition error (${errType || 'unknown'}). Try Quick Voice Helper.`);
          setShowSimulator(true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMessage('Could not start microphone. Opening Quick Voice Helper.');
      setShowSimulator(true);
    }
  };

  const handleSelectPreset = (text: string) => {
    onTranscript(text);
    setShowSimulator(false);
    setErrorMessage(null);
  };

  return (
    <div className="relative flex items-center gap-1.5 shrink-0">
      <label htmlFor="speech-lang-select" className="sr-only">
        Select speech recognition language
      </label>
      <select
        id="speech-lang-select"
        value={language}
        onChange={(e) => {
          setLanguage(e.target.value);
          setErrorMessage(null);
        }}
        disabled={disabled}
        aria-label="Speech language"
        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-blue-600 focus:outline-none"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={toggleListen}
        disabled={disabled}
        title={isListening ? 'Listening... Click to stop' : 'Click to speak (Talk to text / Tamil supported)'}
        aria-label={isListening ? 'Stop listening' : 'Start speaking'}
        className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors ${
          isListening
            ? 'bg-red-600 text-white animate-pulse shadow-md ring-2 ring-red-400'
            : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        {isListening ? (
          <MicOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        )}
      </button>

      {/* Helper / Simulator button */}
      <button
        type="button"
        onClick={() => setShowSimulator(!showSimulator)}
        title="Quick Voice & Tamil Prompt Helper"
        aria-label="Quick voice helper"
        className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
      </button>

      {/* Error / Simulator Modal or Popover */}
      {(errorMessage || showSimulator) && (
        <div className="absolute bottom-full right-0 mb-3 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-2xl z-50 text-left">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Volume2 className="h-4 w-4 text-blue-600" />
              <span>Voice & Tamil Speech Helper</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSimulator(false);
                setErrorMessage(null);
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          {errorMessage && (
            <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Microphone Notice</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
            Select a common voice query in <span className="font-semibold text-blue-600 dark:text-blue-400">Tamil (தமிழ்)</span> or English to instantly insert into your mentor chat:
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {(PRESET_VOICE_PROMPTS[language] || PRESET_VOICE_PROMPTS['en-US']).map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(promptText)}
                className="w-full text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors flex items-center justify-between group"
              >
                <span>{promptText}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-150 transition-opacity font-semibold">
                  Insert →
                </span>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Browser speech API ready</span>
            <button
              type="button"
              onClick={() => {
                setShowSimulator(false);
                setErrorMessage(null);
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
