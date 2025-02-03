import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '1m', target: 100 }, // Maintain 100 users for 1 minute
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be under 1000ms
  },
};

// Test logic
export default function () {
  let token = process.env.TOKEN;
  let headers = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  let filterBody = {
    start: 1,
    size: 20,
  };

  let res = http.post(
    'http://localhost:3000/users/meta-data',
    JSON.stringify(filterBody),
    headers,
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time is < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1); // Sleep for 1 second between iterations
}
