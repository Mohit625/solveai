export class VisionProvider {
  /**
   * @param {Array<{ buffer: Buffer, mimetype: string }>} images
   * @returns {Promise<{ text: string, latency: number }>}
   */
  async extractText(images) {
    throw new Error(`${this.constructor.name} must implement extractText(images)`);
  }
}
