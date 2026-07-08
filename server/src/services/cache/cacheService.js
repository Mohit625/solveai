import crypto from "node:crypto";
import { redisClient } from "../../config/redis.js";
import { env } from "../../config/env.js";

export function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function ocrKey(imageHash, preprocessVersion) {
  return `ocr:${imageHash}:${preprocessVersion}`;
}

function questionKey(questionHash, language, model) {
  return `question:${questionHash}:${language}:${model}`;
}

function followUpKey(previousCodeHash, followUpType, model) {
  return `followup:${previousCodeHash}:${followUpType}:${model}`;
}

export async function getOcrCache(imageHash, preprocessVersion) {
  const cached = await redisClient.get(ocrKey(imageHash, preprocessVersion));
  return cached ? JSON.parse(cached) : null;
}

export async function setOcrCache(imageHash, preprocessVersion, payload) {
  await redisClient.set(
    ocrKey(imageHash, preprocessVersion),
    JSON.stringify(payload),
    "EX",
    env.cacheTtlSeconds
  );
}

export async function getQuestionCache(questionHash, language, model) {
  const cached = await redisClient.get(questionKey(questionHash, language, model));
  return cached ? JSON.parse(cached) : null;
}

export async function setQuestionCache(questionHash, language, model, payload) {
  await redisClient.set(
    questionKey(questionHash, language, model),
    JSON.stringify(payload),
    "EX",
    env.cacheTtlSeconds
  );
}

export async function getFollowUpCache(previousCodeHash, followUpType, model) {
  const cached = await redisClient.get(followUpKey(previousCodeHash, followUpType, model));
  return cached ? JSON.parse(cached) : null;
}

export async function setFollowUpCache(previousCodeHash, followUpType, model, payload) {
  await redisClient.set(
    followUpKey(previousCodeHash, followUpType, model),
    JSON.stringify(payload),
    "EX",
    env.cacheTtlSeconds
  );
}
