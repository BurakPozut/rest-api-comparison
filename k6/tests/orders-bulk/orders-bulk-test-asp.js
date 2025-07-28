import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp-up
    { duration: '1m', target: 100 },  // hold
    { duration: '30s', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],   // Adjust based on network results
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const url = 'http://localhost:5050/api/orders/bulk'; // Replace with actual host/port

  const res = http.get(url, {
    tags: { platform: 'aspnet', endpoint: 'orders-bulk' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body && r.body.length > 0,
  });
}