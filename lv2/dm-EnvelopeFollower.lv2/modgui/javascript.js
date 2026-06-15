
function(event) {
  // initialize scope state
  if (!event.data.scope) {
    event.data.scope = {
      isEnabled: false,
      buffer: new Array(240).fill(0),
      bufferIndex: 0,
      lastValue: 0,
      runningValue: 0,
      smoothingFactor: 0.5, // decrease for more smoothing
      animationFrameId: null,
      canvas: null,
      ctx: null,
    };
  }

  const scope = event.data.scope;
  if (!scope.canvas || !scope.ctx) {
    scope.canvas = event.icon.find("#scope")[0];
    scope.ctx = scope.canvas.getContext("2d");
  }
  const canvas = scope.canvas;
  const ctx = scope.ctx;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    for (let i = 0; i < scope.buffer.length; i++) {
      const index = (scope.bufferIndex + i) % scope.buffer.length;
      const x = (i / (scope.buffer.length - 1)) * canvas.width;
      const y = (1 - scope.buffer[index]) * canvas.height;

      if (i == 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
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

    scope.buffer[scope.bufferIndex] = scope.runningValue;
    scope.bufferIndex = (scope.bufferIndex + 1) % scope.buffer.length;

    draw();
    scope.animationFrameId = requestAnimationFrame(tick);
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

  function cleanUp() {
    scope.isEnabled = false;
    if(scope.animationFrameId != null) {
      cancelAnimationFrame(scope.animationFrameId);
      scope.animationFrameId = null;
    }
    scope.canvas = null;
    scope.ctx = null;
    scope.buffer = null;
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
  } else if (event.type == 'end') {
    cleanUp();
  }
}