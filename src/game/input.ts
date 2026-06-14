import { useEffect, useRef } from "react";
import type { Input } from "../engine/types";

const LEFT = new Set(["ArrowLeft", "KeyA"]);
const RIGHT = new Set(["ArrowRight", "KeyD"]);
const JUMP = new Set(["ArrowUp", "KeyW", "Space"]);
const PREVENT = new Set([...LEFT, ...RIGHT, ...JUMP, "ArrowDown", "KeyS"]);

/**
 * Tracks the keyboard movement keys and returns a *stable mutable ref* to the
 * current {@link Input}. The game loop reads `.current` every frame, so input
 * never triggers a React re-render. Touch buttons can write to the same ref.
 */
export function useKeyboard(enabled: boolean) {
  const input = useRef<Input>({ left: false, right: false, jump: false });

  useEffect(() => {
    if (!enabled) {
      input.current.left = input.current.right = input.current.jump = false;
      return;
    }
    const setKey = (code: string, down: boolean) => {
      if (LEFT.has(code)) input.current.left = down;
      else if (RIGHT.has(code)) input.current.right = down;
      else if (JUMP.has(code)) input.current.jump = down;
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (PREVENT.has(e.code)) e.preventDefault();
      setKey(e.code, true);
    };
    const onUp = (e: KeyboardEvent) => setKey(e.code, false);
    const onBlur = () => {
      input.current.left = input.current.right = input.current.jump = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled]);

  return input;
}
