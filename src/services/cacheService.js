const { redisClient } = require('../config/redis');

const getJson = async (key) => {
  if (!redisClient.isReady) {
    console.warn(`[CACHE UNAVAILABLE] GET ${key}`);
    return null;
  }

  try {
    const value = await redisClient.get(key);

    if (!value) {
      console.log(`[CACHE MISS] ${key}`);
      return null;
    }

    console.log(`[CACHE HIT] ${key}`);

    return JSON.parse(value);
  } catch (error) {
    console.error(`[CACHE READ ERROR] ${key}:`, error.message);

    // Cache failure should not stop the database request.
    return null;
  }
};

const setJson = async (key, value, ttlSeconds) => {
  if (!redisClient.isReady) {
    console.warn(`[CACHE UNAVAILABLE] SET ${key}`);
    return;
  }

  try {
    await redisClient.setEx(
      key,
      ttlSeconds,
      JSON.stringify(value)
    );

    console.log(`[CACHE SET] ${key}, TTL=${ttlSeconds}s`);
  } catch (error) {
    console.error(`[CACHE WRITE ERROR] ${key}:`, error.message);
  }
};

const deleteKey = async (key) => {
  if (!redisClient.isReady) {
    return;
  }

  try {
    await redisClient.del(key);
    console.log(`[CACHE DELETE] ${key}`);
  } catch (error) {
    console.error(`[CACHE DELETE ERROR] ${key}:`, error.message);
  }
};

const deleteByPattern = async (pattern) => {
  if (!redisClient.isReady) {
    return;
  }

  try {
    for await (const scanResult of redisClient.scanIterator({
      MATCH: pattern,
      COUNT: 100
    })) {
      const keys = Array.isArray(scanResult)
        ? scanResult
        : [scanResult];

      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    console.log(`[CACHE PATTERN DELETE] ${pattern}`);
  } catch (error) {
    console.error(
      `[CACHE PATTERN DELETE ERROR] ${pattern}:`,
      error.message
    );
  }
};

module.exports = {
  getJson,
  setJson,
  deleteKey,
  deleteByPattern
};