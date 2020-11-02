<template>
    <div class="column is-4" @click="this.$emit('comparison-clicked', this.id)">
        <div class="compare-card">
            <figure class="image is-4by5">
                <img :src="largeImgUrl">
            </figure>
            <p class="is-size-3">{{ name }}</p>
        </div>
    </div>
</template>
<script>
export default {
    props: {
        id: {type: Number},
        name: {required: true, type: String},
        largeImgUrl: {required: true, type: String},
        score: {required: true, type: Number}
    }
}
</script>
<style scoped>
    img {
        object-fit: cover;
    }
    .compare-card:hover {
        transform: scale(1.05);
    }
    .compare-card {
        transition: transform 0.3s ease;
    }
</style>