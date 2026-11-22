import { Injectable } from '@angular/core';

export interface EnderecoCep {
  logradouro: string;
  bairro: string;
  localidade: string;
}

/** Consultas a serviços públicos: ViaCEP e Nominatim (OpenStreetMap). */
@Injectable({ providedIn: 'root' })
export class ExternoService {
  /** Devolve null quando o CEP não existe. Lança erro se a rede falhar. */
  async buscarCep(cep: string): Promise<EnderecoCep | null> {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return null;
    const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return { logradouro: data.logradouro ?? '', bairro: data.bairro ?? '', localidade: data.localidade ?? '' };
  }

  /** Pede a posição ao navegador e converte em nome de cidade. */
  async cidadePorGps(): Promise<string | null> {
    const pos = await new Promise<GeolocationPosition>((ok, erro) =>
      navigator.geolocation.getCurrentPosition(ok, erro, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }),
    );
    const { latitude, longitude } = pos.coords;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
    );
    const data = await res.json();
    return data.address?.city || data.address?.town || data.address?.village || null;
  }
}
