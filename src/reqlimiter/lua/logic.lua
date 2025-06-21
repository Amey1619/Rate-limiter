-- Remove old entries outside the sliding window
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[2])

-- Count current requests in window
local count = redis.call('ZCARD', KEYS[1])

-- If under the max, allow request
if count < tonumber(ARGV[3]) then
  redis.call('ZADD', KEYS[1], ARGV[1], ARGV[1]) -- timestamp as both score and value
  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4])) -- set TTL for the key
  return {1, tonumber(ARGV[3]) - count - 1} -- allowed, remaining
else
  return {0, 0} -- blocked, 0 remaining
end
