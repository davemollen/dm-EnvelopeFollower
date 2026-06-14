#[derive(Clone, Copy, PartialEq)]
pub enum TrackingMode {
  Peak,
  RMS,
}

pub struct Params {
  pub gain: f32,
  pub tracking_mode: TrackingMode,
  pub rise_factor: f32,
  pub fall_factor: f32,
  pub invert_output: bool,
  sample_rate: f32,
}

impl Params {
  pub fn new(sample_rate: f32) -> Self {
    Self {
      gain: 1.,
      tracking_mode: TrackingMode::Peak,
      rise_factor: 1.,
      fall_factor: 1.,
      invert_output: false,
      sample_rate,
    }
  }

  pub fn set(
    &mut self,
    gain: f32,
    mode: TrackingMode,
    rise: f32,
    fall: f32,
    invert_cv_output: bool,
  ) {
    self.gain = Self::dbtoa(gain);
    self.tracking_mode = mode;
    self.rise_factor = self.mstosamps(rise).recip();
    self.fall_factor = self.mstosamps(fall).recip();
    self.invert_output = invert_cv_output;
  }

  fn mstosamps(&self, time: f32) -> f32 {
    time * 0.001 * self.sample_rate
  }

  fn dbtoa(x: f32) -> f32 {
    (10_f32).powf(x * 0.05)
  }
}
