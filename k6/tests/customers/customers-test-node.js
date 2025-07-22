import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // Tighter threshold for read endpoint
    http_req_failed: ['rate<0.01'],
  }
};

export default function () {
  const res = http.get('http://localhost:3002/api/customers', {
    tags: { endpoint: 'customers' }
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}