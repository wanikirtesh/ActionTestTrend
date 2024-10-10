import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Test configuration
export const options = {
  thresholds: {
    // Assert that 99% of requests finish within 3000ms.
    http_req_duration: ["p(99) < 3000"],
  },
  // Ramp the number of virtual users up and down
  stages: [
    { duration: "10s", target: 15 },
    { duration: "10s", target: 15 },
    { duration: "2s", target: 0 },
  ],
};

// Simulated user behavior
export default function () {

  group('Testing https://google.com', function () {
    let res = http.get('https://google.com');
    check(res, {
      'status was 200': (r) => r.status === 200,
    });
    loadTimegoogle.add(res.timings.duration);
    console.log(`Page load time for google.com: ${res.timings.duration} ms`);
  });

  group('Testing https://yahoo.com', function () {
    let res = http.get('https://yahoo.com');
    check(res, {
      'status was 200': (r) => r.status === 200,
    });
    loadTimeyahoo.add(res.timings.duration);
    console.log(`Page load time for yahoo.com: ${res.timings.duration} ms`);
  });

  group('Testing https://msn.com', function () {
    let res = http.get('https://msn.com');
    check(res, {
      'status was 200': (r) => r.status === 200,
    });
    loadTimemsn.add(res.timings.duration);
    console.log(`Page load time for msn.com: ${res.timings.duration} ms`);
  });

  group('Testing https://site4.com', function () {
    let res = http.get('https://site4.com');
    check(res, {
      'status was 200': (r) => r.status === 200,
    });
    loadTimeSite4.add(res.timings.duration);
    console.log(`Page load time for site4.com: ${res.timings.duration} ms`);
  });

  group('Testing https://site5.com', function () {
    let res = http.get('https://site5.com');
    check(res, {
      'status was 200': (r) => r.status === 200,
    });
    loadTimeSite5.add(res.timings.duration);
    console.log(`Page load time for site5.com: ${res.timings.duration} ms`);
  });
}

export function handleSummary(data) {
	const fileName = `results/summary_${__ENV.TIMESTAMP}.json`
	return {
	  [fileName]: JSON.stringify(data, null, 2),
	};
  }