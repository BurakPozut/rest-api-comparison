import http from 'k6/http';
import { check } from 'k6';

// ✅ Loads file once at test startup
const fileData = open('../../../sample-data/testfile.bin', 'b'); // 'b' = binary mode

export let options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const url = 'http://localhost:5050/api/upload'; // Replace PORT and path if needed

  const formData = {
    file: http.file(fileData, 'test.bin', 'application/octet-stream'),
  };

  const res = http.post(url, formData, {
    tags: { platform: 'aspnet', endpoint: 'upload' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body && r.body.length > 0,
  });
}