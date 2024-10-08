var app = angular.module('myApp',[]);
app.controller('myCtrl', function($scope,$http) {
	var metrics ={};
	var charts = {};
	$scope.isLoading = false;
	$scope.runs = results;
	$scope.selectedRun = null;
	$scope.selectRun = function(run) {
		if ($scope.selectedRun === run) {
			return; // Run already selected
		}
		$scope.selectedRun = run;

		// Load and plot the selected run's data
		loadRunData(run);
	};

	function loadRunData(run){

		$.ajax({
			url: `results/result_${run}.json`,
			method: 'GET',
			dataType: 'text', // Fetch as plain text to handle NDJSON
			success: function(data) {
				var parsedData = parseNDJSON(data);
				processData(parsedData);
				$scope.isLoading = false; // End loading
				// Trigger a digest cycle to update the UI
				$scope.$apply();
			},
			error: function(jqXHR, textStatus, errorThrown) {
				console.error('Error loading run data:', textStatus, errorThrown);
				$scope.isLoading = false; // End loading even on error
				// Trigger a digest cycle to update the UI
				$scope.$apply();
			}
		});
	}

	function parseNDJSON(ndjson) {
		const lines = ndjson.trim().split('\n');
		const jsonObjects = lines.map(line => {
			try {
				return JSON.parse(line);
			} catch (e) {
				console.error('Invalid JSON line:', line);
				return null;
			}
		}).filter(obj => obj !== null);
		return jsonObjects;
	}

	function processData(data){
		metrics = {};
		data.forEach(function(item) {
			if (item.type === 'Metric') {
				var metricName = item.data.name;
				if (!metrics[metricName]) {
					metrics[metricName] = {
						type: item.data.type,
						dataPoints: []
					};
				}
			} else if (item.type === 'Point') {
				var metricName = item.metric;
				if (!metrics[metricName]) {
					metrics[metricName] = {
						type: 'unknown',
						dataPoints: []
					};
				}
				metrics[metricName].dataPoints.push({
					time: new Date(item.data.time),
					value: item.data.value,
					tags: item.data.tags
				});
			}
		});
		plotChart('http_reqs', 'HTTP Requests', 'Number of Requests', 'rgba(54, 162, 235, 0.2)', 'rgba(54, 162, 235, 1)', 'requestsChart');
		plotChart('http_req_duration', 'HTTP Request Duration (ms)', 'Duration (ms)', 'rgba(255, 159, 64, 0.2)', 'rgba(255, 159, 64, 1)', 'responseTimeChart');
		plotChart('http_req_blocked', 'HTTP Request Blocked Time (ms)', 'Blocked Time (ms)', 'rgba(75, 192, 192, 0.2)', 'rgba(75, 192, 192, 1)', 'httpReqBlockedChart');
		plotChart('http_req_failed', 'HTTP Request Failed Rate', 'Failure Rate (%)', 'rgba(255, 99, 132, 0.2)', 'rgba(255,99,132,1)', 'httpReqFailedChart', true); // Rate metric
	}

		function plotChart(metricName, label, yAxisLabel, bgColor, borderColor, chartId, isRate) {
		var metric = metrics[metricName];
		if (!metric) {
			console.error('Metric ' + metricName + ' not found');
			return;
		}

		// Sort data points by time
		var sortedPoints = metric.dataPoints.sort(function(a, b) { return a.time - b.time; });

		// Extract labels and data
		var labels = sortedPoints.map(function(point) { return point.time.toLocaleTimeString(); });
		var data = sortedPoints.map(function(point) {
			if (isRate) {
				return (point.value * 100).toFixed(2); // Convert rate to percentage
			}
			return point.value;
		});

		// If a chart instance already exists, destroy it before creating a new one
		if (charts[chartId]) {
			charts[chartId].destroy();
		}

		// Determine chart type
		var chartType = 'line';
		if (metric.type === 'trend') {
			chartType = 'line';
		} else if (metric.type === 'rate') {
			chartType = 'bar';
		} else {
			chartType = 'line';
		}

		// Create Chart.js instance
		var ctx = document.getElementById(chartId).getContext('2d');
		charts[chartId] = new Chart(ctx, {
			type: chartType,
			data: {
				labels: labels,
				datasets: [{
					label: label,
					data: data,
					backgroundColor: bgColor,
					borderColor: borderColor,
					borderWidth: 1,
					fill: true
				}]
			},
			options: {
				responsive: true,
				scales: {
					x: {
						display: true,
						title: {
							display: true,
							text: 'Time'
						}
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: yAxisLabel
						},
						ticks: {
							// For rate metrics, display percentages
							callback: function(value) {
								if (isRate) {
									return value + '%';
								}
								return value;
							}
						}
					}
				},
				plugins: {
					tooltip: {
						callbacks: {
							label: function(context) {
								var tooltipLabel = context.dataset.label || '';
								if (tooltipLabel) {
									tooltipLabel += ': ';
								}
								if (isRate) {
									tooltipLabel += context.parsed.y + '%';
								} else {
									tooltipLabel += context.parsed.y;
								}
								return tooltipLabel;
							}
						}
					}
				}
			}
		});
	}



});