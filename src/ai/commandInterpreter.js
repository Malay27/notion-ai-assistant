/**
 * LEGACY FILE - NO LONGER USED
 * 
 * This command interpreter has been replaced by the Python backend
 * in backend/main.py which uses DeepSeek-R1 directly via transformers.
 * 
 * All AI processing now happens in the Python backend for better
 * performance and model support.
 * 
 * @deprecated Use BackendService instead
 */

console.warn('⚠️  Legacy command interpreter file. Use BackendService instead.');

class CommandInterpreter {
  constructor() {
    throw new Error('CommandInterpreter is deprecated. Use BackendService instead.');
  }
}

export default CommandInterpreter;
