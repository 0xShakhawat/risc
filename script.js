    (function () {
      const slides = Array.from(document.querySelectorAll(".slide"));
      const prevBtn = document.getElementById("prevBtn");
      const nextBtn = document.getElementById("nextBtn");
      const progressFill = document.getElementById("progressFill");
      const counter = document.getElementById("counter");
      const dotsWrap = document.getElementById("dots");
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const transitionClasses = [
        "enter-fade",
        "exit-fade",
        "enter-slide",
        "exit-slide",
        "enter-zoom",
        "exit-zoom",
        "dir-forward",
        "dir-backward"
      ];

      let currentIndex = 0;
      let isAnimating = false;

      const dots = slides.map((_, index) => {
        const btn = document.createElement("button");
        btn.className = "dot";
        btn.type = "button";
        btn.setAttribute("aria-label", "Go to slide " + (index + 1));
        btn.addEventListener("click", function () {
          goTo(index);
        });
        dotsWrap.appendChild(btn);
        return btn;
      });

      function clearTransitionState(slide) {
        slide.classList.remove.apply(slide.classList, transitionClasses);
      }

      function revealSlide(slide) {
        const revealItems = Array.from(slide.querySelectorAll(".reveal"));
        revealItems.forEach(function (item, idx) {
          item.classList.remove("is-visible");
          const customDelay = Number(item.getAttribute("data-delay") || 0);
          item.style.transitionDelay = (70 + idx * 75 + customDelay) + "ms";
        });

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            revealItems.forEach(function (item) {
              item.classList.add("is-visible");
            });
          });
        });
      }

      function updateUI() {
        const total = slides.length;
        counter.textContent = (currentIndex + 1) + " / " + total;
        progressFill.style.width = (((currentIndex + 1) / total) * 100).toFixed(2) + "%";
        dots.forEach(function (dot, index) {
          dot.classList.toggle("is-current", index === currentIndex);
        });
      }

      function goTo(targetIndex) {
        if (isAnimating || targetIndex === currentIndex || targetIndex < 0 || targetIndex >= slides.length) {
          return;
        }

        const from = slides[currentIndex];
        const to = slides[targetIndex];
        const direction = targetIndex > currentIndex ? "forward" : "backward";
        const transitionType = to.getAttribute("data-transition") || "fade";

        if (prefersReducedMotion) {
          from.classList.remove("is-active");
          to.classList.add("is-active");
          currentIndex = targetIndex;
          revealSlide(to);
          updateUI();
          return;
        }

        isAnimating = true;
        clearTransitionState(from);
        clearTransitionState(to);

        from.classList.add("exit-" + transitionType, "dir-" + direction);
        to.classList.add("is-active", "enter-" + transitionType, "dir-" + direction);

        revealSlide(to);

        let completed = false;
        const finish = function () {
          if (completed) {
            return;
          }
          completed = true;

          clearTransitionState(from);
          clearTransitionState(to);
          from.classList.remove("is-active");
          to.classList.add("is-active");

          currentIndex = targetIndex;
          updateUI();
          isAnimating = false;
        };

        to.addEventListener("animationend", finish, { once: true });
        window.setTimeout(finish, 920);
      }

      function next() {
        const target = (currentIndex + 1) % slides.length;
        goTo(target);
      }

      function prev() {
        const target = (currentIndex - 1 + slides.length) % slides.length;
        goTo(target);
      }

      nextBtn.addEventListener("click", next);
      prevBtn.addEventListener("click", prev);

      window.addEventListener("keydown", function (event) {
        if (["ArrowRight", "PageDown", " "].includes(event.key)) {
          event.preventDefault();
          next();
        }
        if (["ArrowLeft", "PageUp"].includes(event.key)) {
          event.preventDefault();
          prev();
        }
      });

      let wheelLock = false;
      window.addEventListener("wheel", function (event) {
        if (wheelLock) {
          return;
        }
        if (Math.abs(event.deltaY) < 16) {
          return;
        }

        wheelLock = true;
        if (event.deltaY > 0) {
          next();
        } else {
          prev();
        }

        window.setTimeout(function () {
          wheelLock = false;
        }, 460);
      }, { passive: true });

      updateUI();
      revealSlide(slides[0]);

      const canvas = document.getElementById("particles");
      const ctx = canvas.getContext("2d", { alpha: true });
      const particles = [];
      const particleCount = Math.min(120, Math.max(48, Math.floor(window.innerWidth / 18)));

      function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      function random(min, max) {
        return min + Math.random() * (max - min);
      }

      function createParticle() {
        return {
          x: random(0, window.innerWidth),
          y: random(0, window.innerHeight),
          r: random(0.7, 2.2),
          vx: random(-0.12, 0.12),
          vy: random(-0.1, 0.1),
          glow: random(0.2, 0.75)
        };
      }

      function initParticles() {
        particles.length = 0;
        for (let i = 0; i < particleCount; i += 1) {
          particles.push(createParticle());
        }
      }

      function drawParticles() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = window.innerWidth + 10;
          if (p.x > window.innerWidth + 10) p.x = -10;
          if (p.y < -10) p.y = window.innerHeight + 10;
          if (p.y > window.innerHeight + 10) p.y = -10;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(133, 178, 255," + p.glow.toFixed(2) + ")";
          ctx.fill();

          for (let j = i + 1; j < particles.length; j += 1) {
            const q = particles[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              const alpha = (1 - dist / 100) * 0.13;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = "rgba(120, 160, 255," + alpha.toFixed(3) + ")";
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        requestAnimationFrame(drawParticles);
      }

      resizeCanvas();
      initParticles();
      drawParticles();

      window.addEventListener("resize", function () {
        resizeCanvas();
        initParticles();
      });
    })();
