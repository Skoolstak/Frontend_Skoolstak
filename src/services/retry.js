// Automatic recovery for requests that fail for reasons that usually pass on their own.
//
// 1. An expired sign-in token (the app sat idle, e.g. a tablet was put down): refresh the token once
//    and send the request again.
// 2. A brief outage on a read (GET): no response at all (network blip, server waking up) or a
//    429 / 502 / 503 / 504. Wait a little and try again, up to four times.
// Anything that changes data (POST, PUT, DELETE) is never repeated automatically.

export const RETRY_DELAYS_MS = [2000, 5000, 10000, 15000];
const TRANSIENT_STATUSES = [429, 502, 503, 504];
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function installRetry(instance, { refreshToken, delays = RETRY_DELAYS_MS, sleep = defaultSleep }) {
  instance.interceptors.response.use(undefined, async (error) => {
    const config = error.config;
    if (!config || error.code === 'ERR_CANCELED') return Promise.reject(error);
    const status = error.response?.status;

    if (status === 401 && config.headers?.Authorization && !config._authRetried) {
      config._authRetried = true;
      try {
        const token = await refreshToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          return instance(config);
        }
      } catch (_) { /* fall through to the original error */ }
      return Promise.reject(error);
    }

    const isRead = (config.method || 'get').toLowerCase() === 'get';
    const transient = !error.response || TRANSIENT_STATUSES.includes(status);
    const attempt = config._retryCount || 0;
    if (isRead && transient && attempt < delays.length) {
      config._retryCount = attempt + 1;
      await sleep(delays[attempt]);
      return instance(config);
    }
    return Promise.reject(error);
  });
}
