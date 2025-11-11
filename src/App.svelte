<script lang="ts">
  import "./app.css";
  import { onMount } from "svelte";

  let startButton: HTMLButtonElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  let audioCtx: AudioContext;
  let stereoNode: StereoPannerNode;

  let gainNode: GainNode;
  let sineWaveOscillator: OscillatorNode;

  let isPointerDown = false;
  let pointerPos = { x: 0, y: 0 };

  const render = (timestamp: number) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // gray grid background
    const gridSize = 50;
    ctx.strokeStyle = "#ccc";

    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    if (isPointerDown) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.arc(
        pointerPos.x,
        pointerPos.y,
        (timestamp % 16) + 10,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pointerPos.x, pointerPos.y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    requestAnimationFrame(render);
  };

  const startAudioContext = (event: MouseEvent) => {
    audioCtx = new AudioContext();
    stereoNode = audioCtx.createStereoPanner();
    stereoNode.connect(audioCtx.destination);

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.connect(stereoNode);

    sineWaveOscillator = audioCtx.createOscillator();
    sineWaveOscillator.type = "sine";
    sineWaveOscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
    sineWaveOscillator.connect(gainNode);
    sineWaveOscillator.start();

    startButton.style.display = "none";
    event.stopPropagation();
  };

  onMount(() => {
    canvas = document.getElementById("visualizer") as HTMLCanvasElement;
    ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handlePointerDown = () => {
      isPointerDown = true;
    };

    const handlePointerUp = () => {
      isPointerDown = false;
      gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0);
    };

    const handlePointerMove = (event: MouseEvent) => {
      pointerPos = { x: event.clientX, y: event.clientY };

      if (isPointerDown) {
        const diagnonal = Math.hypot(canvas.width, canvas.height);

        const distance = Math.hypot(
          pointerPos.x - canvas.width / 2,
          pointerPos.y - canvas.height / 2,
        );

        gainNode.gain.setTargetAtTime(
          Math.min(1 - Math.pow(distance / (diagnonal / 2), 0.03), 1),
          audioCtx.currentTime,
          0.01,
        );

        const pan = Math.max(
          -1,
          Math.min(1, Math.max(-1, 1 - (pointerPos.x / canvas.width) * 2)),
        ); // -1 (left) to 1 (right)
        stereoNode.pan.setTargetAtTime(pan, audioCtx.currentTime, 0.01);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointermove", handlePointerMove);
    resizeCanvas();
    render(0);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointermove", handlePointerMove);

      sineWaveOscillator.stop();
      sineWaveOscillator.disconnect();
      audioCtx.close();
    };
  });
</script>

<main class="w-full h-full bg-gray-300 p-0 m-0">
  <canvas id="visualizer" class="w-full h-full"></canvas>
  <button
    class="w-full h-full flex items-center justify-center absolute top-0 left-0 text-black text-2xl"
    on:mousedown={startAudioContext}
    bind:this={startButton}
  >
    Start
  </button>
</main>

<style>
  main {
    text-align: center;
    font-family: Arial, sans-serif;
  }
</style>
