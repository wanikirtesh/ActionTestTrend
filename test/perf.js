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
    { duration: "2s", target: 15 },
    { duration: "2s", target: 15 },
    { duration: "2s", target: 0 },
  ],
};

// Simulated user behavior
export default function () {
  let res = http.get("https://www.google.com");
  // Validate response status
  check(res, { "status was 200": (r) => r.status == 200 });
  sleep(1);
}

export function handleSummary(data) {
	const fileName = `results/summary_${__ENV.TIMESTAMP}.json`
	return {
	  [fileName]: JSON.stringify(data, null, 2),
	};
  }