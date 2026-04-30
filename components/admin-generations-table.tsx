"use client";

import { useEffect, useState } from "react";
import styles from "@/components/forms.module.css";

type GenerationRecord = {
  id: string;
  created_at: string;
  model: string;
  metadata: { usage?: { total_tokens: number } };
  profiles: { email: string };
};

export function AdminGenerationsTable() {
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);

  useEffect(() => {
    fetch("/api/admin/generations")
      .then((res) => res.json())
      .then((data) => setGenerations(data));
  }, []);

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Utilisateur</th>
            <th>Modèle</th>
            <th>Tokens</th>
          </tr>
        </thead>
        <tbody>
          {generations.map((gen) => (
            <tr key={gen.id}>
              <td>{new Date(gen.created_at).toLocaleDateString()}</td>
              <td>{gen.profiles?.email}</td>
              <td>{gen.model}</td>
              <td>{gen.metadata?.usage?.total_tokens ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
