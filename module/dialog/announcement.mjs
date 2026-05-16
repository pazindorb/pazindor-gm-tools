import { emitEvent } from "../configs/socket.mjs";

class Announcement {
  constructor(announcement, timer=5000) {
    const duration = Number(timer);

    this.announcement = announcement ?? "";
    this.timer = Number.isFinite(duration) ? Math.max(duration, 0) : 5000;
    this.element = null;
    this.timeout = null;
    this.closing = false;
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  announce() {
    if (!this.announcement) return;

    this.element = this._createElement();
    document.body.appendChild(this.element);
    document.addEventListener("keydown", this._onKeyDown, true);
    this.timeout = window.setTimeout(() => this.close(), this.timer);
  }

  close() {
    if (this.closing || !this.element) return;

    this.closing = true;
    window.clearTimeout(this.timeout);
    document.removeEventListener("keydown", this._onKeyDown, true);
    this.element.classList.add("pgt-announcement-closing");
    window.setTimeout(() => {
      this.element?.remove();
      this.element = null;
    }, 450);
  }

  _onKeyDown(event) {
    if (event.key !== "Escape") return;

    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  _createElement() {
    const overlay = document.createElement("div");
    overlay.className = "pgt-announcement-overlay";

    const content = document.createElement("div");
    content.className = "pgt-announcement-content";
    content.textContent = this.announcement;

    const hint = document.createElement("div");
    hint.className = "pgt-announcement-hint";
    hint.textContent = "Press ESC to exit";

    overlay.append(content, hint);
    return overlay;
  }
}

export function announceAll(announcement, timer) {
  emitEvent(PGT.CONST.SOCKET.EMIT.ANNOUNCEMENT, {announcement: announcement, timer: timer});
  announce(announcement, timer);
}

export function announce(announcement, timer) {
  new Announcement(announcement, timer).announce();
}
