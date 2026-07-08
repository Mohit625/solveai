export class AIProvider {
  /**
   * @param {string} prompt
   * @returns {Promise<{ content: string, promptTokens: number|null, completionTokens: number|null, latency: number }>}
   */
  async generateCode(prompt) {
    throw new Error(`${this.constructor.name} must implement generateCode(prompt)`);
  }
}
