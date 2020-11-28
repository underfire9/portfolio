
	//Section minHeight
    $(".scroll-panel .container").css({ minHeight: $(window).innerHeight() + 'px' });
	
	//Scroll Nav
	$('.scroll-page').scrollNav();
	$('.scroll-nav').addClass("nav-hide");
	
	//Background Mouse Effect
	var lFollowX = 0,
		lFollowY = 0,
		x = 0,
		y = 0,
		friction = 1 / 30;
	
	function moveBackground() {
	  x += (lFollowX - x) * friction;
	  y += (lFollowY - y) * friction;
	  
	  translate = 'translate(' + x + 'px, ' + y + 'px) scale(1.1)';
	
	  $('.has-bg').css({
		'-webit-transform': translate,
		'-moz-transform': translate,
		'transform': translate
	  });
	
	  window.requestAnimationFrame(moveBackground);
	}
	
	$(window).on('mousemove click', function(e) {
	
	  var lMouseX = Math.max(-100, Math.min(100, $(window).width() / 2 - e.clientX));
	  var lMouseY = Math.max(-100, Math.min(100, $(window).height() / 2 - e.clientY));
	  lFollowX = (20 * lMouseX) / 100; // 100 : 12 = lMouxeX : lFollow
	  lFollowY = (10 * lMouseY) / 100;
	
	});
	
	moveBackground();
	
	
	//Landing Three.js
    $(function(){
		var cubeScene = function cubeScene() {
		  var bgColor = 0xfafafa;
		  var scene = new THREE.Scene();
		  var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
		
		  var renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		  });
		  renderer.setSize(window.innerWidth, window.innerHeight);
		  renderer.setClearColor(bgColor, 0);
		  
		  //Canvas
          var container = document.getElementById('landing');
          container.appendChild(renderer.domElement);
		
		  camera.position.z = 5;
		
		  var cubes = generateCubes(20);
		  var frame = 0;
		
		  render();
		
		  function createCube() {
			var px = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
			var py = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
			var pz = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];
			var rx = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
			var ry = arguments.length <= 4 || arguments[4] === undefined ? 0 : arguments[4];
			var rz = arguments.length <= 5 || arguments[5] === undefined ? 0 : arguments[5];
		
			var geometry = new THREE.BoxGeometry(.5, .5, .5);
			var material = new THREE.MeshBasicMaterial({ color: bgColor });
			var cube = new THREE.Mesh(geometry, material);
			var edges = new THREE.EdgesHelper(cube, 0xcccccc);
			cube.geometry.mergeVertices();
			cube.position.x = px;
			cube.position.y = py;
			cube.position.z = pz;
		
			cube.rotation.x = rx;
			cube.rotation.y = ry;
			cube.rotation.z = rz;
		
			scene.add(cube);
			scene.add(edges);
			return cube;
		  }
		
		  function generateCubes() {
			var cubeQty = arguments.length <= 0 || arguments[0] === undefined ? 20 : arguments[0];
		
			var cubes = [];
			for (var i = 0; ++i < cubeQty;) {
			  var cube = createCube(_.random(-5.0, 5.0), _.random(-4.0, 4.0), _.random(-4.0, 4.0), _.random(), _.random(), _.random());
			  cubes.push(cube);
			}
			return cubes;
		  }
		
		  function render() {
			frame++;
			cubes.forEach(function (cube, i) {
			  cube.rotation.x += 0.005;
			  cube.rotation.y += 0.005;
			  cube.rotation.z += 0.005;
			  cube.position.y = Math.sin((frame + i * 100) * .005) * 2;
			});
			requestAnimationFrame(render);
			renderer.render(scene, camera);
		  }
		
		  return { camera: camera, renderer: renderer };
		};
		
		var cubeSceneInit = cubeScene();
		
		window.addEventListener('resize', function () {
		  cubeSceneInit.camera.aspect = window.innerWidth / window.innerHeight;
		  cubeSceneInit.camera.updateProjectionMatrix();
		  cubeSceneInit.renderer.setSize(window.innerWidth, window.innerHeight);
		});
	});
    
    <!-- Welly JS -->
		// Scrolling ==========================
		var preSec = 's1pos';
		var prePos = 0;
		var preScr = null;
		var navHeight = 85;
		
		$(window).on('scroll', _.throttle(onScrolling, 100));
		
		function onScrolling () {
			var pos = $(window).scrollTop();
		
			if (pos > prePos && pos - prePos >= 50) {
				prePos = pos;
		
				if (preScr != 'up') {
					preScr = 'up';
		
					$('.header').animate({top: '-' + navHeight});
				}
			} else if (pos < prePos && prePos - pos >= 50) {
				prePos = pos;
		
				if (preScr != 'down') {
					preScr = 'down';
		
					$('.header').animate({top: 0});
				}
			}
		
			var landing = $('#landing').position().top;
			var who_we_are = $('#who_we_are').position().top;
			var why_here = $('#why_here').position().top;
			var people = $('#people').position().top;
			var history = $('#history').position().top;
		
			if (pos >= landing && pos < who_we_are) {
				if (preSec !== 'landing') {
		
					$('body').animate({backgroundColor: '#fafafa'}, 120);
					$('.header').removeClass('lightness').addClass('nav-hide');
					$('.scroll-nav').removeClass('lightness').addClass('nav-hide');
					$('canvas').addClass('fixed');
					$('.space-wrap').removeClass('has-bg');
		
					preSec = 'landing';
				}
				
			} else if (pos >= who_we_are && pos < why_here) {
				if (preSec !== 'who_we_are') {
		
					$('body').animate({backgroundColor: '#212121'}, 120);
					$('.header').addClass('lightness').removeClass('nav-hide');
					$('.scroll-nav').addClass('lightness').removeClass('nav-hide');
					$('canvas').removeClass('fixed');
					$('.space-wrap').addClass('has-bg');
					$('.astronaut').addClass('move');
		
					preSec = 'who_we_are';
				}
				
			} else if (pos >= why_here && pos < people) {
				if (preSec !== 'why_here') {
		
					$('body').animate({backgroundColor: '#fafafa'}, 120);
					$('.header').removeClass('lightness');
					$('.scroll-nav').removeClass('lightness');
					$('.space-wrap').removeClass('has-bg');
		
					preSec = 'why_here';
				}
				
			} else if (pos >= people && pos < history) {
				if (preSec !== 'people') {
		
					$('body').animate({backgroundColor: '#fafafa'}, 120);
		
					preSec = 'people';
				}
			} else if (pos >= history) {
				if (preSec !== 'history') {
		
					$('body').animate({backgroundColor: '#fafafa'}, 120);
		
					preSec = 'history';
				}
			}
		}

		// Question Effect ==================================
		var count = 0;

		var arr = [
			'我有看到問題的全部面貌嗎？',
			'有沒有更好的解決方法呢？',
			'以前可行，但是現在可行嗎？',
			'我們可以接受失敗嗎？',
			'我們是不是夠勇敢來犧牲短期利益成就長期成長呢？',
		];
		
		runEffect();
		
		function runEffect () {
			count ++;
			if(count === arr.length) count = 0;
		
			$('#strip-text').append(arr[count]);
		
			_.delay(function() {
				$('#strip-span').toggleClass('strip');
				$('#strip-text').toggleClass('item-text');
			}, 1500, 'later');
		
			_.delay(function() {
				$('#strip-span').toggleClass('strip');
				$('#strip-text').toggleClass('item-text');
				$('#strip-div').removeClass('strip-in').addClass('strip-out');
			}, 6500, 'later');
		
			_.delay(function() {
				$('#strip-div').removeClass('strip-out').addClass('strip-in');
				$('#strip-text').empty();
				runEffect();
			}, 8000, 'later');
		}
		
// People Wall ==================================
var imgArr = [];

(function() {
   $.getJSON("../assets/medium/name-list.json", function(data) {
       for (var i = 0; i < data.data.length; i ++) { 
           imgArr.push(data.data[i]);
       }
   });
})();

_.delay(function() {
    var newImgArr = shuffle(imgArr);

    for (var j = 0; j < newImgArr.length; j ++) {
        $('#insert-protrait').append('<li><a href="#"><img src="../assets/medium/' + newImgArr[j].file + '.jpg" /><div class="info-content"><span class="position">' + newImgArr[j].department + '</span><span class="name">' + newImgArr[j].name + '</span></div></a></li>');
    }
}, 500, 'later');

_.delay(function() {
    $('#ri-grid').gridrotator( {
        rows : 4,
        columns : 8,
        step : 'random',
        maxStep    : 3,
        animSpeed : 1200,
        animType : 'random',
        animEasingOut : 'linear',
        animEasingIn : 'linear',
        interval : 1200,
        //onhover : true,
        w1024 : { rows : 4, columns : 6 },
        w768 : {rows : 3,columns : 3 },
		w568 : {rows : 3,columns : 3 },
        w480 : {rows : 3,columns : 2 },
		w320 : {rows : 3,columns : 2 },
    } );
}, 1000, 'later');


// Common functions ==================================

function shuffle(array) {
	var currentIndex = array.length, temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {

	// Pick a remaining element...
	randomIndex = Math.floor(Math.random() * currentIndex);
	currentIndex -= 1;

	// And swap it with the current element.
	temporaryValue = array[currentIndex];
	array[currentIndex] = array[randomIndex];
	array[randomIndex] = temporaryValue;
	}

	return array;
}
