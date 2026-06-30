import path from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import {
  installWhisperCpp,
  downloadWhisperModel,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const WHISPER_PATH = path.join(process.cwd(), "whisper.cpp");
const WHISPER_VERSION = "1.6.0";
const WHISPER_MODEL = "base.en"; // Fast and accurate for English

console.log("Installing Whisper.cpp...");
await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });

console.log("Downloading model...");
await downloadWhisperModel({ folder: WHISPER_PATH, model: WHISPER_MODEL });

console.log("Transcribing audio...");
const whisperCppOutput = await transcribe({
  inputPath: path.join(process.cwd(), "temp/social-video.wav"),
  model: WHISPER_MODEL,
  tokenLevelTimestamps: true,
  whisperPath: WHISPER_PATH,
  whisperCppVersion: WHISPER_VERSION,
  printOutput: true,
  translateToEnglish: false,
  language: "en",
  splitOnWord: true,
});

const { captions } = toCaptions({ whisperCppOutput });

if (!existsSync(path.join(process.cwd(), "public"))) {
  mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
}

writeFileSync(
  path.join(process.cwd(), "public/social-video.json"),
  JSON.stringify(captions, null, 2),
);

console.log(`Transcription complete! ${captions.length} captions written to public/social-video.json`);
