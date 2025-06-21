# **ReqLimiter** 🚫
<p align="center">
  <img src="https://github.com/Amey1619/ReqLimiter/blob/main/assets/flowchart.jpeg" alt="Architecture Flowchart" width="600"/>
</p>

A lightweight and customizable **rate limiting utility** built using **Redis**, **Lua**, and designed with **NestJS-style service architecture** — yet usable in any Node.js or JavaScript application.

---

## 🚀 Introduction

`reqlimiter` is designed for modern backend systems that need reliable request limiting without bloating the codebase. It combines:

- **Redis** for fast in-memory request tracking and atomic operations.
- **Lua** for performance-optimized scripts executed directly inside Redis.
- **NestJS-style service** design for better modularity and testability — even if you’re not using NestJS.

---

## 🔁 Sliding Window Algorithm

This library uses the **Sliding Window Log** algorithm, a more accurate and fair approach than fixed or leaky bucket strategies.

### ✅ Benefits:

- Smooth rate limiting without burst traffic spikes.
- Time-accurate tracking using Redis sorted logs.
- Dynamically trims old entries.

---

## 🧩 Lua Script for Atomicity

All rate limiting logic is powered by a Redis-side **Lua script**, which:

- Atomically tracks timestamps.
- Prunes expired entries.
- Computes remaining quota.
- Prevents race conditions in high-concurrency environments.

### ✅ Benefits of Lua:

- Executes atomically in Redis (no race conditions).
- Reduces client-server round trips.
- Scales well with concurrent traffic.

---

## 💡 Features

- ✅ **Custom Window Size** (e.g. 60 seconds)
- ✅ **Configurable Request Limit**
- ✅ **Automatic Abuse Detection**
- ✅ **Temporary IP Bans**
- ✅ **Lua-optimized Performance**
- ✅ **Zero NestJS dependency** in usage
- ✅ **Works in any Node.js or JS project**

---

## 📦 Installation

```bash
npm install reqlimiter 
```
---

## 📦 Dependencies

- Requires **Node.js**
- Requires **Redis** instance (local or cloud-hosted)
- Requires [`ioredis`](https://www.npmjs.com/package/ioredis) **version `^5.6.1`**

---

## **Usage**

To apply rate-limiting to your application using `reqlimiter`

🔗 Step 1: Connect to Redis

Use `ioredis` to establish a connection with your Redis instance (local or cloud-hosted):

```Javascript
const Redis = require("ioredis");
const { rateLimit } = require("reqlimiter");

// Connect to Redis (local or cloud)
const redis = new Redis("redis://localhost:6379");
```

⚙️ Step-2 Then configure according to your connection

Create a rateLimiter instance by passing your Redis client and desired configuration options:

```Javascript 
// Create rate limiter instance
const rateLimiter = rateLimit({
  redisClient: redis,
  config: {
    windowSize: 60,    // Duration of the time window in seconds
    maxRequests: 5,    // Max requests allowed within the window
  },
});
```

🧱 Step 3: Apply Rate Limiting Middleware

```Javascript
// Middleware
const rateLimiterMiddleware = async (req, res, next) => {
  try {
    const key = req.ip; // or use req.headers['x-api-key'] etc. for token-based limits
    const { allowed } = await rateLimiter.check(key); // use .check method to validate

    if (!allowed) {
      return res.status(429).json({ message: "Too many requests" });
    }

    next(); // Allow request if not rate-limited
  } catch (err) {
    console.error("Rate Limiter Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
```
🛠️ Advanced Configuration (Optional)

You can pass additional options to tune rate limiting:

```Javascript
const rateLimiter = rateLimit({
  redisClient: redis,
  config: {
    windowSize: 60,         // Time window in seconds
    maxRequests: 10,        // Allowed requests in that window
    banDuration: 3600,      // Seconds to ban a user after abuse
    abuseThreshold: 5,      // # of times allowed to exceed before ban
    abuseWindow: 120,       // Time period to track abuse attempts
  },
});
```
Created by **@Ameygupta**
