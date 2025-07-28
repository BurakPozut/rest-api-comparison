import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // ramp-up to 10 users
    { duration: '1m', target: 10 },   // hold
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // allow up to 3s latency
    http_req_failed: ['rate<0.05'],     // allow up to 5% failure
  },
};

export default function () {
  const res = http.get('http://localhost:3002/api/file-read', {
    tags: { platform: 'node', endpoint: 'file-read' }
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}