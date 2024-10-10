import http from "k6/http";
import { check, sleep, group } from "k6";

// Test configuration
export const options = {
  discardResponseBodies: true,
  scenarios: {
    contacts: {
      executor: 'per-vu-iterations',
      vus: __ENV.VU,
      iterations: 10,
      maxDuration: __ENV.DURATION+'',
    },
  },
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