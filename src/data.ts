import { Match } from './types';

const rawData = [
  {id: 1, g: 'A', ta: 'México', tb: 'Sudáfrica', d: '2026-06-11T16:00:00'},
  {id: 2, g: 'A', ta: 'Corea del Sur', tb: 'República Checa', d: '2026-06-11T23:00:00'},
  {id: 4, g: 'D', ta: 'Estados Unidos', tb: 'Paraguay', d: '2026-06-12T22:00:00'},
  {id: 3, g: 'B', ta: 'Canadá', tb: 'Bosnia y Herzegovina', d: '2026-06-12T16:00:00'},
  {id: 8, g: 'B', ta: 'Qatar', tb: 'Suiza', d: '2026-06-13T16:00:00'},
  {id: 7, g: 'C', ta: 'Brasil', tb: 'Marruecos', d: '2026-06-13T19:00:00'},
  {id: 5, g: 'C', ta: 'Haití', tb: 'Escocia', d: '2026-06-13T22:00:00'},
  {id: 6, g: 'D', ta: 'Australia', tb: 'Turquía', d: '2026-06-14T01:00:00'},

  {id: 10, g: 'E', ta: 'Alemania', tb: 'Curazao', d: '2026-06-14T14:00:00'},
  {id: 11, g: 'F', ta: 'Países Bajos', tb: 'Japón', d: '2026-06-14T17:00:00'},
  {id: 9, g: 'E', ta: 'Costa de Marfil', tb: 'Ecuador', d: '2026-06-14T20:00:00'},
  {id: 12, g: 'F', ta: 'Suecia', tb: 'Túnez', d: '2026-06-14T23:00:00'},

  {id: 14, g: 'H', ta: 'España', tb: 'Cabo Verde', d: '2026-06-15T13:00:00'},
  {id: 16, g: 'G', ta: 'Bélgica', tb: 'Egipto', d: '2026-06-15T16:00:00'},
  {id: 13, g: 'H', ta: 'Arabia Saudita', tb: 'Uruguay', d: '2026-06-15T19:00:00'},
  {id: 15, g: 'G', ta: 'Irán', tb: 'Nueva Zelanda', d: '2026-06-15T22:00:00'},

  {id: 17, g: 'I', ta: 'Francia', tb: 'Senegal', d: '2026-06-16T16:00:00'},
  {id: 18, g: 'I', ta: 'Irak', tb: 'Noruega', d: '2026-06-16T19:00:00'},
  {id: 19, g: 'J', ta: 'Argentina', tb: 'Argelia', d: '2026-06-16T22:00:00'},
  {id: 20, g: 'J', ta: 'Austria', tb: 'Jordania', d: '2026-06-17T01:00:00'},

  {id: 23, g: 'K', ta: 'Portugal', tb: 'RD Congo', d: '2026-06-17T14:00:00'},
  {id: 22, g: 'L', ta: 'Inglaterra', tb: 'Croacia', d: '2026-06-17T17:00:00'},
  {id: 21, g: 'L', ta: 'Ghana', tb: 'Panamá', d: '2026-06-17T20:00:00'},
  {id: 24, g: 'K', ta: 'Uzbekistán', tb: 'Colombia', d: '2026-06-17T23:00:00'},

  {id: 25, g: 'A', ta: 'República Checa', tb: 'Sudáfrica', d: '2026-06-18T13:00:00'},
  {id: 26, g: 'B', ta: 'Suiza', tb: 'Bosnia y Herzegovina', d: '2026-06-18T16:00:00'},
  {id: 27, g: 'B', ta: 'Canadá', tb: 'Qatar', d: '2026-06-18T19:00:00'},
  {id: 28, g: 'A', ta: 'México', tb: 'Corea del Sur', d: '2026-06-18T22:00:00'},

  {id: 32, g: 'D', ta: 'Estados Unidos', tb: 'Australia', d: '2026-06-19T16:00:00'},
  {id: 30, g: 'C', ta: 'Escocia', tb: 'Marruecos', d: '2026-06-19T19:00:00'},
  {id: 29, g: 'C', ta: 'Brasil', tb: 'Haití', d: '2026-06-19T21:30:00'},
  {id: 31, g: 'D', ta: 'Turquía', tb: 'Paraguay', d: '2026-06-20T00:00:00'},

  {id: 35, g: 'F', ta: 'Países Bajos', tb: 'Suecia', d: '2026-06-20T14:00:00'},
  {id: 33, g: 'E', ta: 'Alemania', tb: 'Costa de Marfil', d: '2026-06-20T17:00:00'},
  {id: 34, g: 'E', ta: 'Ecuador', tb: 'Curazao', d: '2026-06-20T21:00:00'},
  {id: 36, g: 'F', ta: 'Túnez', tb: 'Japón', d: '2026-06-21T01:00:00'},

  {id: 38, g: 'H', ta: 'España', tb: 'Arabia Saudita', d: '2026-06-21T13:00:00'},
  {id: 39, g: 'G', ta: 'Bélgica', tb: 'Irán', d: '2026-06-21T16:00:00'},
  {id: 37, g: 'H', ta: 'Uruguay', tb: 'Cabo Verde', d: '2026-06-21T19:00:00'},
  {id: 40, g: 'G', ta: 'Nueva Zelanda', tb: 'Egipto', d: '2026-06-21T22:00:00'},

  {id: 43, g: 'J', ta: 'Argentina', tb: 'Austria', d: '2026-06-22T14:00:00'},
  {id: 42, g: 'I', ta: 'Francia', tb: 'Irak', d: '2026-06-22T18:00:00'},
  {id: 41, g: 'I', ta: 'Noruega', tb: 'Senegal', d: '2026-06-22T21:00:00'},
  {id: 44, g: 'J', ta: 'Jordania', tb: 'Argelia', d: '2026-06-23T00:00:00'},

  {id: 47, g: 'K', ta: 'Portugal', tb: 'Uzbekistán', d: '2026-06-23T14:00:00'},
  {id: 45, g: 'L', ta: 'Inglaterra', tb: 'Ghana', d: '2026-06-23T17:00:00'},
  {id: 46, g: 'L', ta: 'Panamá', tb: 'Croacia', d: '2026-06-23T20:00:00'},
  {id: 48, g: 'K', ta: 'Colombia', tb: 'RD Congo', d: '2026-06-23T23:00:00'},

  {id: 51, g: 'B', ta: 'Suiza', tb: 'Canadá', d: '2026-06-24T16:00:00'},
  {id: 52, g: 'B', ta: 'Bosnia y Herzegovina', tb: 'Qatar', d: '2026-06-24T16:00:00'},
  {id: 49, g: 'C', ta: 'Escocia', tb: 'Brasil', d: '2026-06-24T19:00:00'},
  {id: 50, g: 'C', ta: 'Marruecos', tb: 'Haití', d: '2026-06-24T19:00:00'},
  {id: 53, g: 'A', ta: 'República Checa', tb: 'México', d: '2026-06-24T22:00:00'},
  {id: 54, g: 'A', ta: 'Sudáfrica', tb: 'Corea del Sur', d: '2026-06-24T22:00:00'},

  {id: 55, g: 'E', ta: 'Curazao', tb: 'Costa de Marfil', d: '2026-06-25T17:00:00'},
  {id: 56, g: 'E', ta: 'Ecuador', tb: 'Alemania', d: '2026-06-25T17:00:00'},
  {id: 57, g: 'F', ta: 'Japón', tb: 'Suecia', d: '2026-06-25T20:00:00'},
  {id: 58, g: 'F', ta: 'Túnez', tb: 'Países Bajos', d: '2026-06-25T20:00:00'},
  {id: 59, g: 'D', ta: 'Turquía', tb: 'Estados Unidos', d: '2026-06-25T23:00:00'},
  {id: 60, g: 'D', ta: 'Paraguay', tb: 'Australia', d: '2026-06-25T23:00:00'},

  {id: 61, g: 'I', ta: 'Noruega', tb: 'Francia', d: '2026-06-26T16:00:00'},
  {id: 62, g: 'I', ta: 'Senegal', tb: 'Irak', d: '2026-06-26T16:00:00'},
  {id: 65, g: 'H', ta: 'Cabo Verde', tb: 'Arabia Saudita', d: '2026-06-26T21:00:00'},
  {id: 66, g: 'H', ta: 'Uruguay', tb: 'España', d: '2026-06-26T21:00:00'},
  {id: 63, g: 'G', ta: 'Egipto', tb: 'Irán', d: '2026-06-27T00:00:00'},
  {id: 64, g: 'G', ta: 'Nueva Zelanda', tb: 'Bélgica', d: '2026-06-27T00:00:00'},

  {id: 67, g: 'L', ta: 'Panamá', tb: 'Inglaterra', d: '2026-06-27T18:00:00'},
  {id: 68, g: 'L', ta: 'Croacia', tb: 'Ghana', d: '2026-06-27T18:00:00'},
  {id: 71, g: 'K', ta: 'Colombia', tb: 'Portugal', d: '2026-06-27T20:30:00'},
  {id: 72, g: 'K', ta: 'RD Congo', tb: 'Uzbekistán', d: '2026-06-27T20:30:00'},
  {id: 69, g: 'J', ta: 'Argelia', tb: 'Austria', d: '2026-06-27T23:00:00'},
  {id: 70, g: 'J', ta: 'Jordania', tb: 'Argentina', d: '2026-06-27T23:00:00'},
];

const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const INITIAL_FIXTURE: Match[] = rawData
  .sort((a, b) => a.d.localeCompare(b.d))
  .map(m => {
      const year = parseInt(m.d.substring(0, 4));
      const month = parseInt(m.d.substring(5, 7)) - 1;
      const day = parseInt(m.d.substring(8, 10));
      const hour = m.d.substring(11, 16); // "HH:mm"
      const formattedDate = `${day} ${months[month]} ${hour}`;
      return {
          id: m.id.toString(),
          stage: `Grupo ${m.g}`,
          teamA: m.ta,
          teamB: m.tb,
          datetime: m.d,
          formattedDate,
      };
});

const secondRoundRawData = [
  {id: 101, ta: 'Sudáfrica', tb: 'Canadá', d: '2026-06-28T16:00:00'},
  {id: 102, ta: 'Brasil', tb: 'Japón', d: '2026-06-29T14:00:00'},
  {id: 103, ta: 'Alemania', tb: 'Paraguay', d: '2026-06-29T17:30:00'},
  {id: 104, ta: 'Países Bajos', tb: 'Marruecos', d: '2026-06-29T22:00:00'},
  {id: 105, ta: 'Costa de Marfil', tb: 'Noruega', d: '2026-06-30T14:00:00'},
  {id: 106, ta: 'Francia', tb: 'Suecia', d: '2026-06-30T18:00:00'},
  {id: 107, ta: 'México', tb: 'Ecuador', d: '2026-06-30T22:00:00'},
  {id: 108, ta: 'Inglaterra', tb: 'RD Congo', d: '2026-07-01T13:00:00'},
  {id: 109, ta: 'Bélgica', tb: 'Senegal', d: '2026-07-01T17:00:00'},
  {id: 110, ta: 'Estados Unidos', tb: 'Bosnia y Herzegovina', d: '2026-07-01T21:00:00'},
  {id: 111, ta: 'España', tb: 'Austria', d: '2026-07-02T16:00:00'},
  {id: 112, ta: 'Portugal', tb: 'Croacia', d: '2026-07-02T20:00:00'},
  {id: 113, ta: 'Suiza', tb: 'Argelia', d: '2026-07-03T00:00:00'},
  {id: 114, ta: 'Australia', tb: 'Egipto', d: '2026-07-03T15:00:00'},
  {id: 115, ta: 'Argentina', tb: 'Cabo Verde', d: '2026-07-03T19:00:00'},
  {id: 116, ta: 'Colombia', tb: 'Ghana', d: '2026-07-03T22:30:00'},
];

export const SECOND_ROUND_FIXTURE: Match[] = secondRoundRawData
  .sort((a, b) => a.d.localeCompare(b.d))
  .map(m => {
      const year = parseInt(m.d.substring(0, 4));
      const month = parseInt(m.d.substring(5, 7)) - 1;
      const day = parseInt(m.d.substring(8, 10));
      const hour = m.d.substring(11, 16); // "HH:mm"
      const formattedDate = `${day} ${months[month]} ${hour}`;
      return {
          id: m.id.toString(),
          stage: 'Segunda Ronda',
          teamA: m.ta,
          teamB: m.tb,
          datetime: m.d,
          formattedDate,
      };
  });
