// Express 5 nativno podržava async middleware — ovaj wrapper je zadržan
// radi kompatibilnosti, ali samo prosleđuje funkciju
const asyncHandler = (fn) => fn;

export default asyncHandler;