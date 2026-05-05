"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = (data.get("name") as string) ?? "";
    const email = (data.get("email") as string) ?? "";

    if (!name || !email) {
      setStatus("error");
      setMessage("Please add your name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      setMessage("That email doesn't look quite right.");
      return;
    }

    // TODO: replace with Supabase insert to signups table
    setStatus("success");
    setMessage("You're on the list. We'll be in touch when something good comes in.");
    form.reset();
  }

  const msgClass = `form-msg${status === "success" ? " success" : status === "error" ? " error" : ""}`;

  return (
    <form className="newsletter-form" noValidate onSubmit={handleSubmit}>
      <label className="field">
        <span>Your name</span>
        <input type="text" name="name" autoComplete="name" required />
      </label>
      <label className="field">
        <span>Email address</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>
      <label className="field field-full">
        <span>
          What are you most excited for?{" "}
          <span className="muted">(optional)</span>
        </span>
        <input type="text" name="interests" placeholder="Tomatoes, peppers, dahlias…" />
      </label>
      <button className="btn" type="submit">
        Sign me up
      </button>
      <p className={msgClass} role="status">
        {message}
      </p>
    </form>
  );
}
