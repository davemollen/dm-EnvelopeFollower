
function(event) {
  const canvas = event.icon.find("#scope")[0];
  const ctx = canvas.getContext("2d");

  // initialize scope state
  if (!event.data.scope) {
    event.data.scope = {
      isEnabled: false,
      buffer: new Array(240).fill(0),
      lastValue: 0,
      runningValue: 0,
      smoothingFactor: 0.5 // decrease for more smoothing
    };
  }

  const scope = event.data.scope;
  const buffer = scope.buffer;
  const bufferSize = buffer.length;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    for (let i = 0; i < buffer.length; i++) {
      const x = (i / (buffer.length - 1)) * canvas.width;
      const y = (1 - buffer[i]) * canvas.height;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#FFD573";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  
  function tick() {
    if (!scope.isEnabled) {
      return;
    }

    scope.runningValue =
      scope.runningValue + (scope.lastValue - scope.runningValue) * scope.smoothingFactor;

    // push into buffer continuously
    buffer.push(scope.runningValue);
    buffer.shift();

    draw();
    requestAnimationFrame(tick);
  }

  function startScope() {
    scope.isEnabled = true;
    tick();
  }

  function stopScope() {
    scope.isEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scope.buffer.fill(0);
  }

  function handle_port_values(symbol, value) {
    switch (symbol) {
      case 'scope_input': {
        scope.lastValue = value;
        break;
      }
      case 'invert_cv_output': {
        const invert = event.icon.find("[mod-port-symbol=invert_cv_output]");
        const light = invert.next(".mod-light");
        if(value == 1) {
          light.addClass("on");
          light.removeClass("off");
        } else {
          light.addClass("off");
          light.removeClass("on");
        }
        break;
      }
      case ':bypass': {
        const scope = event.icon.find("#scope");
        if (value == 1) {
          scope.addClass("disabled");
          stopScope();
        } else if (!scope.isEnabled) {
          scope.removeClass("disabled");
          startScope();
        }
        break;
      }
      default:
        break;
    }
  }

  if (event.type == 'start') {
    const ports = event.ports;
    for (const port in ports) {
      handle_port_values(ports[port].symbol, ports[port].value);
    }
  }
  else if (event.type == 'change') {  
    handle_port_values(event.symbol, event.value);
  }
}