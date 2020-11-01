<template>
<div class="level my-3 box is-size-4 is-mobile">
    <div class="level-left">
      <div class="level-item">
        <figure class="image is-64x64" :style="backgroundImg">
        </figure>
      </div>
      <div class="level-item">
        <span>{{ name }}</span>
      </div>
    </div>
    <div class="level-right">
      <div class="level-item mx-6">
        <span>{{ ogScore }}</span>
      </div>
      <div class="level-item mx-6">
        <span>{{ roundedScore }}</span>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    props: {
      id: { required: true, type: Number },
      name: { required: true, type: String },
      imgUrl: { required: true, type: String },
      score: { type: Number },
      ogScore: { type: Number }
    },
    data() {
      return {
        Score: this.score,
        backgroundImg: {
          'background-image': 'url(' + this.imgUrl + ')',
          'background-position': 'center'
        }
      }
    },
    computed: {
      roundedScore() {
        return this.score > 100 ? 100 : this.score < 1 ? 1 : Math.round(this.score);
      }
    }
  }
</script>
<style scoped>

</style>