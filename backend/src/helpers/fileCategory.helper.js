const path = require("path");

const CATEGORIES = {
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  PDF: "pdf",
  DOCUMENT: "document",
  ARCHIVE: "archive",
  CODE: "code",
  OTHER: "other",
};

const MIME_MAP = {
  // Images
  "image/jpeg": CATEGORIES.IMAGE,
  "image/png": CATEGORIES.IMAGE,
  "image/gif": CATEGORIES.IMAGE,
  "image/webp": CATEGORIES.IMAGE,
  "image/svg+xml": CATEGORIES.IMAGE,
  "image/bmp": CATEGORIES.IMAGE,

  // Videos
  "video/mp4": CATEGORIES.VIDEO,
  "video/webm": CATEGORIES.VIDEO,
  "video/ogg": CATEGORIES.VIDEO,
  "video/quicktime": CATEGORIES.VIDEO,
  "video/x-msvideo": CATEGORIES.VIDEO,
  "video/x-matroska": CATEGORIES.VIDEO,

  // Audio
  "audio/mpeg": CATEGORIES.AUDIO,
  "audio/wav": CATEGORIES.AUDIO,
  "audio/ogg": CATEGORIES.AUDIO,
  "audio/aac": CATEGORIES.AUDIO,
  "audio/flac": CATEGORIES.AUDIO,
  "audio/mp4": CATEGORIES.AUDIO,

  // PDF
  "application/pdf": CATEGORIES.PDF,

  // Documents
  "application/msword": CATEGORIES.DOCUMENT,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": CATEGORIES.DOCUMENT,
  "application/vnd.ms-excel": CATEGORIES.DOCUMENT,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": CATEGORIES.DOCUMENT,
  "application/vnd.ms-powerpoint": CATEGORIES.DOCUMENT,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": CATEGORIES.DOCUMENT,
  "text/plain": CATEGORIES.DOCUMENT,
  "text/csv": CATEGORIES.DOCUMENT,
  "text/markdown": CATEGORIES.DOCUMENT,
  "application/rtf": CATEGORIES.DOCUMENT,

  // Archives
  "application/zip": CATEGORIES.ARCHIVE,
  "application/x-zip-compressed": CATEGORIES.ARCHIVE,
  "application/x-rar-compressed": CATEGORIES.ARCHIVE,
  "application/x-7z-compressed": CATEGORIES.ARCHIVE,
  "application/x-tar": CATEGORIES.ARCHIVE,
  "application/gzip": CATEGORIES.ARCHIVE,

  // Code
  "application/json": CATEGORIES.CODE,
  "text/javascript": CATEGORIES.CODE,
  "application/javascript": CATEGORIES.CODE,
  "text/html": CATEGORIES.CODE,
  "text/css": CATEGORIES.CODE,
  "text/x-python": CATEGORIES.CODE,
};

const EXTENSION_MAP = {
  // Images
  jpg: CATEGORIES.IMAGE,
  jpeg: CATEGORIES.IMAGE,
  png: CATEGORIES.IMAGE,
  gif: CATEGORIES.IMAGE,
  webp: CATEGORIES.IMAGE,
  svg: CATEGORIES.IMAGE,
  bmp: CATEGORIES.IMAGE,
  ico: CATEGORIES.IMAGE,

  // Videos
  mp4: CATEGORIES.VIDEO,
  mkv: CATEGORIES.VIDEO,
  webm: CATEGORIES.VIDEO,
  mov: CATEGORIES.VIDEO,
  avi: CATEGORIES.VIDEO,
  wmv: CATEGORIES.VIDEO,
  flv: CATEGORIES.VIDEO,

  // Audio
  mp3: CATEGORIES.AUDIO,
  wav: CATEGORIES.AUDIO,
  ogg: CATEGORIES.AUDIO,
  m4a: CATEGORIES.AUDIO,
  flac: CATEGORIES.AUDIO,
  aac: CATEGORIES.AUDIO,

  // PDF
  pdf: CATEGORIES.PDF,

  // Documents
  doc: CATEGORIES.DOCUMENT,
  docx: CATEGORIES.DOCUMENT,
  xls: CATEGORIES.DOCUMENT,
  xlsx: CATEGORIES.DOCUMENT,
  ppt: CATEGORIES.DOCUMENT,
  pptx: CATEGORIES.DOCUMENT,
  txt: CATEGORIES.DOCUMENT,
  csv: CATEGORIES.DOCUMENT,
  rtf: CATEGORIES.DOCUMENT,
  odt: CATEGORIES.DOCUMENT,
  ods: CATEGORIES.DOCUMENT,
  odp: CATEGORIES.DOCUMENT,
  md: CATEGORIES.DOCUMENT,

  // Archives
  zip: CATEGORIES.ARCHIVE,
  rar: CATEGORIES.ARCHIVE,
  "7z": CATEGORIES.ARCHIVE,
  tar: CATEGORIES.ARCHIVE,
  gz: CATEGORIES.ARCHIVE,

  // Code
  js: CATEGORIES.CODE,
  jsx: CATEGORIES.CODE,
  ts: CATEGORIES.CODE,
  tsx: CATEGORIES.CODE,
  py: CATEGORIES.CODE,
  html: CATEGORIES.CODE,
  css: CATEGORIES.CODE,
  json: CATEGORIES.CODE,
  java: CATEGORIES.CODE,
  cpp: CATEGORIES.CODE,
  c: CATEGORIES.CODE,
  cs: CATEGORIES.CODE,
  go: CATEGORIES.CODE,
  rb: CATEGORIES.CODE,
  php: CATEGORIES.CODE,
  sql: CATEGORIES.CODE,
};

/**
 * Determine the file category from its mime type and filename
 * @param {string} mimeType
 * @param {string} filename
 * @returns {string} One of CATEGORIES
 */
const getFileCategory = (mimeType, filename) => {
  if (mimeType && MIME_MAP[mimeType.toLowerCase()]) {
    return MIME_MAP[mimeType.toLowerCase()];
  }

  const ext = path.extname(filename || "").replace(".", "").toLowerCase();
  if (ext && EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext];
  }

  if (mimeType && mimeType.startsWith("image/")) return CATEGORIES.IMAGE;
  if (mimeType && mimeType.startsWith("video/")) return CATEGORIES.VIDEO;
  if (mimeType && mimeType.startsWith("audio/")) return CATEGORIES.AUDIO;
  if (mimeType && mimeType.startsWith("text/")) return CATEGORIES.DOCUMENT;

  return CATEGORIES.OTHER;
};

module.exports = {
  CATEGORIES,
  getFileCategory,
};
