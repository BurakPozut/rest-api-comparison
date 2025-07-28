import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp-up to 100 users
    { duration: '1m', target: 100 },  // hold for 1 minute
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const url = 'http://localhost:3002/api/login'; // Replace with actual port

  const payload = JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: {
      platform: 'node', // or 'nodejs' if testing Node
      endpoint: 'login'
    }
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'received token or response body': (r) => r.body && r.body.length > 0,
  });
}