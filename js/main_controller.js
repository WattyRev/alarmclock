var global = {};
var app = angular.module('alarm', []);

app.controller('MainController', ['$http', '$scope', '$filter', function($http, $scope, $filter){
	$scope.global = {}

	//clock
	$scope.global.time = new Date();
	setInterval(function(){
		//TODO only change variable if minute has changed.
		var prev_time = $filter('date')($scope.global.time, 'HH:mm');
		if($filter('date')($scope.global.time, 'HH:mm') !== $filter('date')(new Date(), 'HH:mm')){
			$scope.global.time = new Date();
			$scope.$apply();
		}
	}, 1000);

	//alarms
	$scope.global.alarms = localStorage['watty-alarms'] ? JSON.parse(localStorage['watty-alarms']) : [];
	$scope.global.next_alarm = '';

	//timers
	$scope.global.timers = localStorage['watty-timers'] ? JSON.parse(localStorage['watty-timers']) : [];

	//editing
	$scope.global.editing = false;
	$scope.global.edit_window = false;
	$scope.global.edit_window_new = 
		{
			time: new Date(),
			days:[
				{
					d: 'sun',
					enabled: false,
					dd: 'sunday'
				},
				{
					d: 'mon',
					enabled: true,
					dd: 'monday'
				},
				{
					d: 'tue',
					enabled: true,
					dd: 'tuesday'
				},
				{
					d: 'wed',
					enabled: true,
					dd: 'wednesday'
				},				
				{
					d: 'thu',
					enabled: true,
					dd: 'thursday'
				},
				{
					d: 'fri',
					enabled: true,
					dd: 'friday'
				},
				{
					d: 'sat',
					enabled: false,
					dd: 'saturday'
				}
			],
			snooze:10,
			enabled:true,
			timer: 8
		};
	$scope.global.edit_window_content = JSON.parse(JSON.stringify($scope.global.edit_window_new));
	$scope.global.edit_window_content.time = new Date($scope.global.edit_window_content.time);
	$scope.global.editing_alarm = {
		tf: false,
		alarm: '',
		timer: false
	}; 
	$scope.global.need_start = true;
	$scope.global.playing = false;
	$scope.global.snooze = {
		tf: false,
		duration: 0
	};

	//display
	$scope.global.minimal = false;
	$scope.global.show_settings = false;

	//settings
	$scope.settings = localStorage['watty-alarms-settings'] ? JSON.parse(localStorage['watty-alarms-settings']) : {};
	if (!$scope.settings.clock_color) {
		$scope.settings.clock_color = {
			r: 216,
			g: 30,
			b: 30
		};
	}

	//number for day
	var day_num = {'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6};

	//edit alarms

	$scope.global.edit = function(i, alarm){
		if (i != undefined) {
			//edit existing alarm
			$scope.global.edit_window_content = alarm;
			$scope.global.edit_window_content.time = new Date($scope.global.edit_window_content.time);
			$scope.global.editing_alarm.tf = true;
			$scope.global.editing_alarm.alarm = i;
			$scope.global.editing_alarm.timer = false;
		} else {
			//create new alarm
			$scope.global.editing_alarm.tf = false;
			$scope.global.edit_window_content = JSON.parse(JSON.stringify($scope.global.edit_window_new));
			$scope.global.edit_window_content.time = new Date($scope.global.edit_window_content.time);
			$scope.global.editing_alarm.timer = false;
		}
		$scope.global.edit_window = true;
	};
	$scope.global.edit_timer = function(i, timer){
		if (i != undefined) {
			//edit existing timer
			$scope.global.edit_window_content.timer = timer.timer;
			$scope.global.edit_window_content.snooze = timer.snooze;
			$scope.global.editing_alarm.tf = true;
			$scope.global.editing_alarm.alarm = i;
			$scope.global.editing_alarm.timer = true;
		} else {
			//create new timer
			$scope.global.editing_alarm.tf = false;
			$scope.global.editing_alarm.timer = true;
			$scope.global.edit_window_content.time = 6;
		}
		$scope.global.edit_window = true;
	};

	$(document).click(function(e){
		var element = $(e.target);
		if($scope.global.edit_window && !element.parents('#edit-alarm').length && element.attr('id') !== 'edit-alarm' && !element.hasClass('edit')  && !element.hasClass('add-alarm')){
			$scope.global.edit_window = false;
			$scope.$apply();
		}
	});

	//save and delete alarms
	$scope.global.save_alarm = function(){
		var alarm = JSON.parse(JSON.stringify($scope.global.edit_window_content));
		if ($scope.global.editing_alarm.timer === true) {
			//saving timer
			if($scope.global.editing_alarm.tf === true) {
				//updating existing timer
				$scope.global.timers[$scope.global.editing_alarm.alarm] = {timer:alarm.timer, snooze:alarm.snooze};
				localStorage['watty-timers'] = JSON.stringify($scope.global.timers);
			} else {
				//new timer
				$scope.global.timers.push({timer:alarm.timer, snooze:alarm.snooze});
				localStorage['watty-timers'] = JSON.stringify($scope.global.timers);
			}
		} else if ($scope.global.editing_alarm.tf === true) {
			$scope.global.alarms[$scope.global.editing_alarm.alarm] = alarm;
			localStorage['watty-alarms'] = JSON.stringify($scope.global.alarms);
		} else {
			$scope.global.alarms.push(alarm);
			localStorage['watty-alarms'] = JSON.stringify($scope.global.alarms);
		}
		$scope.global.edit_window = false;
		$scope.global.next_alarm = $scope.global.get_next_alarm();
	};
	$scope.global.delete_alarm = function(index){
		if($scope.global.edit_window_content.timer) {
			var a = confirm('Are you sure you want to delete this timer?');
			if(a == true){
				$scope.global.timers.splice(index,1);
				localStorage['watty-timers'] = JSON.stringify($scope.global.timers);
			}
			$scope.global.edit_window = false;
			return;
		}
		var a = confirm('Are you sure you want to delete this alarm?');
		if(a == true){
			$scope.global.alarms.splice(index,1);
			localStorage['watty-alarms'] = JSON.stringify($scope.global.alarms);
		}
		$scope.global.edit_window = false;
		$scope.global.next_alarm = $scope.global.get_next_alarm();
	};
	$scope.global.get_next_alarm = function(){
		var today = $filter('date')(new Date(), 'EEE');
		today = day_num[today];
		var enabled_alarms = [],
			today_alarms = [],
			tomorrow_alarms = [];
		//create array of enabled alarms
		$.each($scope.global.alarms, function(i, alarm) {
			if (alarm.enabled) {
				enabled_alarms.push(alarm);
			}
		});

		if (!enabled_alarms.length) {
			return null;
		}

		//get alarms that are enabled for today
		//remove ones that have already gone off
		$.each(enabled_alarms, function(i, alarm) {
			if (alarm.days[today].enabled) {
				var alarm_time = $filter('date')(new Date(alarm.time), 'HHmm');
				var current_time = $filter('date')(new Date(), 'HHmm');
				if(parseInt(alarm_time) < parseInt(current_time)) {
					return;
				}
				today_alarms.push(alarm);
			}
		});
		//return the one with the lowest time
		if (today_alarms.length) {
			today_alarms.sort(function(a, b) {
				return new Date(b.time).getTime() - new Date(a.time).getTime();
			});
			return today_alarms[0];
		}

		//get alarms that are enabled for tomorrow
		$.each(enabled_alarms, function(i, alarm) {
			var tomorrow = today + 1;
			if (tomorrow === 7) {
				tomorrow = 0;
			}
			if (alarm.days[tomorrow].enabled) {
				tomorrow_alarms.push(alarm);
			}
		});

		//return the one with the lowest time
		if (tomorrow_alarms.length) {
			tomorrow_alarms.sort(function(a, b) {
				return new Date(b.time).getTime() - new Date(a.time).getTime();
			});
			return tomorrow_alarms[0];
		} else {
			return null;
		}
	}
	//get music
	$scope.global.get_next_song = function(){
		var get_song = $http.get('next_song.php');
		get_song.success(function(data, status, headers, config){
			$scope.global.song = data.replace('\\', '').slice(1, -1);
		});
		get_song.error(function(data, status, headers, config){
			console.log('Ajax failed');
			$scope.global.get_next_song;
		});
	}
	$scope.global.get_next_song();
	//instigate audio element
	$scope.global.instigate = function(){
		var audio = document.getElementById('audio');
		audio.play();
		audio.pause();
		$scope.global.need_start = false;
	}
	//save settings to local storage
	$scope.global.save_settings = function() {
		localStorage['watty-alarms-settings'] = JSON.stringify($scope.settings);
		$scope.global.show_settings = false;
	}	
	//start timer
	$scope.global.start_timer = function(i, timer) {
		if($scope.global.timers[i].running === true) {
			$scope.global.timers[i].running = false;
			return;
		}
		var time = timer.timer * 60;
		var snooze = timer.snooze;
		$scope.global.timers[i].running = true;
		$scope.global.timers[i].current = time;
		var intID = setInterval(function(){
			time --;
			$scope.global.timers[i].current = time;
			if($scope.global.timers[i].running === false) {
				clearInterval(intID);
			}
			if(time === 0) {
				$scope.global.timers[i].running = false;
				$scope.global.snooze.duration = snooze;
				$scope.global.playing = true;
			}
		}, 60000);
	}
	$scope.global.run_fallback = function() {
		var phone_number = '5096802083';
		var data = {
			to: phone_number + '@vtext.com',
			message: 'You missed your alarm!'
		};
		$.post("send_mail.php", data,  function(data) {
			console.log(data);
		})
	}
	//stop alarm
	$scope.global.stop_alarm = function() {
		var a = confirm('Are you sure you want to turn off the alarm?');
		if(a == true){
			$scope.global.playing = false;
		}
	}

	//play alarm on time
	$scope.$watch('global.time', function(time){
		var formatted = $filter('date')(time, 'HH:mm');
		var day = $filter('date')(time, 'EEE');
		$.each($scope.global.alarms, function(i, alarm){
			if (!alarm.enabled) {
				return;
			}
			var enable_alarm = false;

			$.each(alarm.days, function(i, alarm_day){
				if(alarm_day.d === day.toLowerCase()){
					if(alarm_day.enabled){
						enable_alarm = true;
					}
					return;
				}
			})

			var alarm_time = $filter('date')(alarm.time, 'HH:mm')
			if(alarm_time === formatted && enable_alarm){
				$scope.global.playing = true;
				$scope.global.snooze = {
					duration: parseInt(alarm.snooze),
					tf: false
				}
			}

			$scope.global.next_alarm = $scope.global.get_next_alarm();

		})
	})

	//play sounds
	var alarm_fallback;
	$scope.$watch('global.playing', function(playing){
		var audio = document.getElementById('audio');
		if(playing){
			audio.play();
			alarm_fallback = setTimeout(function() {
				alert('You missed your alarm!');
				$scope.global.run_fallback();
			}, 300000);
		}else{
			audio.pause();
			clearTimeout(alarm_fallback);
			$scope.global.get_next_song();
		}
	})

	//snooze

	$scope.$watch('global.snooze.tf', function(snoozing){
		if(snoozing){
			var timeout = $scope.global.snooze.duration * 60000;
			$scope.global.playing = false;
			$scope.global.snooze.time_left = timeout;
			var counter = setInterval(function() {
				$scope.global.snooze.time_left = $scope.global.snooze.time_left - 1000;
				$scope.$apply();
			}, 1000);
			setTimeout(function() {
				console.log('done snoozing');
				$scope.global.playing = true;
				$scope.global.snooze.tf = false;
				$scope.global.snooze.duration = timeout / 60000;
				clearInterval(counter);
				$scope.global.snooze.time_left = 0;
				$scope.$apply();
			}, 	timeout);
		}
	})
}]);
app.filter('hour', function() {
	return function(input) {
		var hours = Math.floor(input / 60);
		var minutes = Math.floor(input - hours*60);
		if (minutes < 10) {
			minutes = '0' + minutes;
		}
		return hours + ':' + minutes;
	}
})