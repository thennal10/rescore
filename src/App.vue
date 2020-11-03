<template>
  <div class="hero is-fullheight" v-if="!accessToken">
    <div class="hero-body">
      <div class="container is-max-desktop has-text-centered">
        <h1 class="title is-size-2 pb-4">Anilist Rescorer</h1>
        <p class="subtitle is-size-4">
          Tired of half the anime on your list being scored way too high by a younger you with a shittier taste?
          Want to revamp your list but it's too much of a pain to do it normally? Welcome to the anime rescorer. 
        </p>
        <a 
          class="button is-info is-medium" 
          href='https://anilist.co/api/v2/oauth/authorize?client_id=4281&response_type=token'>
          Login with AniList
        </a>
      </div>
    </div>
  </div>
  <section class="section" v-if="accessToken">
    <div class="container has-text-centered">
      <h2 class="title"> Pick the one you like more</h2>
      <h3 class="subtitle">Your scores will adjust accordingly.</h3>
      <div class="columns is-centered">
        <transition-group name="compare-list">
          <AnimeCompare 
            v-for="anime in compareSet" :key="anime.id"
            :name="anime.name" :id="anime.id" :largeImgUrl="anime.largeImgUrl" :score="anime.score"
            @comparison-clicked="comparisonClick"
          />
        </transition-group>
      </div>
      <button class="button is-light is-size-5-desktop" @click="newComparison">Skip</button>
    </div>
    <div class="container mt-6">
      <h2 class="title has-text-centered">Your Anime List</h2>
      <p class="subtitle has-text-centered">Click on any number in the New Score column to edit it directly.</p>
      <div class="buttons">
        <button class="button is-warning is-size-5-desktop" @click="updateList">Update</button>
        <button class="button is-danger is-size-5-desktop" @click="this.animeList.forEach(anime => anime.score = anime.ogScore)">Reset</button>
        <button class="button is-info is-size-5-desktop" @click="this.animeList.forEach(anime => anime.score = 50)">Set all to 50</button>
      </div>
      <table class="table is-hoverable is-fullwidth is-size-5 is-size-6-mobile">
        <thead>
          <tr>
            <th style="width: 1%" class="is-hidden-mobile"></th> <!-- Makes it take minimum required space -->
            <th>Name</th>
            <th class="has-text-centered">Original Score</th>
            <th class="has-text-centered">New Score</th>
          </tr>
        </thead>
        <transition-group name="flip-list" tag="tbody">
          <tr v-for="anime in sortedAnimeList" :key="anime.id">
            <AnimeItem 
              :name="anime.name" :imgUrl="anime.imgUrl"
              v-model:score="anime.score"
              :id="anime.id" :ogScore="anime.ogScore"
            />
          </tr>
        </transition-group>
      </table>
    </div>
  </section>
  <ConfirmModal 
    :active="confirmModalActive" @close="confirmModalActive = false" 
    @confirmed="updateList" @bypass="this.confirmModalBypass = !this.confirmModalBypass" 
  />
</template>

<script>
import AnimeItem from './components/AnimeItem.vue'
import AnimeCompare from './components/AnimeCompare.vue'
import ConfirmModal from './components/ConfirmModal.vue'

export default {
  name: 'App',
  components: {
    AnimeItem,
    AnimeCompare,
    ConfirmModal
  },
  data() {
    return {
      animeList: [], 
      compareSet: [],
      tempCompareSet: [],
      userError: '',
      accessToken: null,
      confirmModalActive: false,
      confirmModalBypass: false
      };
  },
  created() {
    /*
    Only two things are stored in session storage: the accessToken and the animeList
    Initially checks if accessToken is saved
    getUserId calls getUserList, which checks whether animeList is saved
    if an invalid access toke is saved, getUserId catches an error, resets it to null, and
    calls getAccessToken, which gets it from the hash (if available)
    */
    if (sessionStorage.getItem("accessToken")) {
      this.accessToken = sessionStorage.getItem("accessToken")
      this.getUserId()
    }
    else {
      this.getAccessToken()
    }
  },
  methods: {
    getAccessToken() {
      try {
        this.accessToken = window.location.hash.match(/(?<=access_token=)(.*?)(?=&)/)[0]
        this.getUserId()
        sessionStorage.setItem("accessToken", this.accessToken)
      } 
      catch (error) {
        if (!(error instanceof TypeError))
        {
          console.log(error)
        }
      }
    },

    getUserId() {
      // Anilist API query
      var query = `
        query {
          Viewer {
            id
          }
        }
      `;

      var url = 'https://graphql.anilist.co',
        options = {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + this.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: query
          })
      };

      fetch(url, options)
        .then(response => response.json())
        .then(data => this.getList(data.data.Viewer.id))
        .catch(this.handleAccessTokenError)
    },

    handleAccessTokenError() {
      this.accessToken = null
      sessionStorage.setItem("accessToken", this.accessToken)
      this.getAccessToken()
    },

    getList(id) {
      // If the list is already saved in memory, load it and yeet out
      if (sessionStorage.getItem("animeList")) {
        this.animeList = JSON.parse(sessionStorage.getItem("animeList"))
        this.newComparison()
        return 1
      }
      // Anilist API query
      var query = `
        query ($userId: Int) {
          MediaListCollection (userId: $userId, type: ANIME) {
            lists {
              name
              status
              entries {
                score(format: POINT_100)
                media {
                  id
                  title {
                    romaji
                  }
                  coverImage {
                    extraLarge
                    large
                    medium
                    color
                  }
                }
              }
            }
          }
        }
      `;

      var variables = {
        userId: id
      };

      var url = 'https://graphql.anilist.co',
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            variables: variables
          })
      };

      // Make the HTTP Api request
      fetch(url, options)
        .then(response => response.json())
        .then(data => this.renderList(data));
        
    },

    renderList(data) {
      this.animeList.length = 0
      for (var list of data.data.MediaListCollection.lists) {
        if (list.status=="COMPLETED") {
          for (var entry of list.entries) {
            var score = entry.score;
            var item_id = entry.media.id;
            var title = entry.media.title.romaji;
            var cover = entry.media.coverImage.medium;
            var large = entry.media.coverImage.extraLarge;
            if (score != 0) {
              this.animeList.push({ name: title, id: item_id, imgUrl: cover, largeImgUrl: large, score: score, ogScore: score});
            }
          }
        }
      }
      this.newComparison()
    },

    updateList() {
      // Check if we need to confirm, or if the modal is already active
      if (!(this.confirmModalBypass || this.confirmModalActive)) {
        this.confirmModalActive = true
        return 1
      }

      // Filter and round anime scores
      var filteredAnimeList = this.animeList.filter(anime => anime.score != anime.ogScore);
      var scoreList = filteredAnimeList.map(anime => anime.score > 100 ? 100 : anime.score < 1 ? 1 : Math.round(anime.score))

      // Cobble up the query and variables
      var queryVariableHeader = ''
      var query = ''
      var variables = {}

      for (const [index, anime] of filteredAnimeList.entries()) {
        queryVariableHeader += `$id${index}: Int, $score${index}: Int,`
        query += `
          s${index}: SaveMediaListEntry (mediaId: $id${index}, scoreRaw: $score${index}) {
            score
          }`
        variables[`id${index}`] = anime.id
        variables[`score${index}`] = scoreList[index]
      }

      queryVariableHeader = queryVariableHeader.slice(0, -1) // Removes the final comma
      query = `mutation (${queryVariableHeader}) {\n` + query + '}'
      
      // Set up the request and send it
      var url = 'https://graphql.anilist.co',
      options = {
          method: 'POST',
          headers: {
              'Authorization': 'Bearer ' + this.accessToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify({
              query: query,
              variables: variables
          })
      };

      fetch(url, options)
        .then(response => response.json())
        .then(data => console.log(data))
    },

    comparisonClick(id) {
      var winner = this.compareSet.find(anime => anime.id == id)
      var loser = this.compareSet.find(anime => anime.id != id)
      
      // Ripped straight from the wikipedia page for elo rating system
      var expectedW = 1/(1 + (10 ** ((loser.score - winner.score)/20)))
      winner.score = winner.score + 8*(1 - expectedW)
      
      var expectedL = 1/(1 + (10 ** ((winner.score - loser.score)/20)))
      loser.score = loser.score + 8*(0 - expectedL)
      
      this.newComparison()
    },

    newComparison() {
      this.compareSet.length = 0
      // Because lol javascript
      const random = (len) => Math.floor(Math.random() * len)

      var randomItem1 = this.animeList[random(this.animeList.length)];
      var animeListFiltered = this.animeList.filter(item => item != randomItem1) // Remove it from pool
      var randomItem2 = animeListFiltered[random(animeListFiltered.length)]
      
      // The below fuckery is required to properly sync animations
      this.tempCompareSet = [randomItem1, randomItem2]
      window.setTimeout(this.setComparison, 600)
    },

    setComparison() {
      this.compareSet = this.tempCompareSet
    }
  },
  computed: {
    // So I don't have to bother with resorting the array and saving state every time I make a change
    sortedAnimeList: function() {
      // Checks if animeList actually has anything so I don't save an empty list to session memory
      if (this.animeList.length) {
        sessionStorage.setItem('animeList', JSON.stringify(this.animeList))
      }
      return [...this.animeList].sort((a, b) => b.score - a.score); // thank you ES6, very cool
    }
  }
}
</script>
<style>
  .flip-list-move {
    transition: transform 0.8s ease;
  }

  .compare-list-enter-active,
  .compare-list-leave-active {
    transition: all 0.6s ease-in-out;
  }

  .compare-list-enter-from{
    transform: translateY(10%);
    opacity: 0;
  }

  .compare-list-leave-to {
    transform: translateY(-10%);
    opacity: 0;
  }
</style>