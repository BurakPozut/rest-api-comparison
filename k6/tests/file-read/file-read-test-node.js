import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp-up to 100 users
    { duration: '1m', target: 100 },  // hold at 100 users
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests must be < 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
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