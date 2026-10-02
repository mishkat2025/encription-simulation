// Real code for every array algorithm, in four languages.
//
// A line that ends in "@@N" belongs to line N of the algorithm's pseudocode.
// The marker is not shown: the code panel strips it and uses it to highlight
// the lines that match the step being played. Lines without a marker are
// never highlighted.

export type Language = 'pseudocode' | 'python' | 'java' | 'cpp' | 'c';

export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'pseudocode', label: 'Pseudocode' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
];

type Sources = Record<Exclude<Language, 'pseudocode'>, string>;

export const code: Record<string, Sources> = {
  'linear-search': {
    python: `
def linear_search(a, target):
    for i in range(len(a)):  @@0
        if a[i] == target:  @@1
            return i  @@1
    return -1  @@2`,
    java: `
static int linearSearch(int[] a, int target) {
    for (int i = 0; i < a.length; i++) {  @@0
        if (a[i] == target) return i;  @@1
    }
    return -1;  @@2
}`,
    cpp: `
int linearSearch(const vector<int>& a, int target) {
    for (int i = 0; i < (int)a.size(); i++) {  @@0
        if (a[i] == target) return i;  @@1
    }
    return -1;  @@2
}`,
    c: `
int linear_search(const int a[], int n, int target) {
    for (int i = 0; i < n; i++) {  @@0
        if (a[i] == target) return i;  @@1
    }
    return -1;  @@2
}`,
  },

  'binary-search': {
    python: `
def binary_search(a, target):
    low, high = 0, len(a) - 1  @@0
    while low <= high:  @@1
        mid = (low + high) // 2  @@2
        if a[mid] == target:  @@3
            return mid  @@3
        if a[mid] < target:  @@4
            low = mid + 1  @@4
        else:  @@5
            high = mid - 1  @@5
    return -1  @@6`,
    java: `
static int binarySearch(int[] a, int target) {
    int low = 0, high = a.length - 1;  @@0
    while (low <= high) {  @@1
        int mid = low + (high - low) / 2;  @@2
        if (a[mid] == target) return mid;  @@3
        if (a[mid] < target) low = mid + 1;  @@4
        else high = mid - 1;  @@5
    }
    return -1;  @@6
}`,
    cpp: `
int binarySearch(const vector<int>& a, int target) {
    int low = 0, high = (int)a.size() - 1;  @@0
    while (low <= high) {  @@1
        int mid = low + (high - low) / 2;  @@2
        if (a[mid] == target) return mid;  @@3
        if (a[mid] < target) low = mid + 1;  @@4
        else high = mid - 1;  @@5
    }
    return -1;  @@6
}`,
    c: `
int binary_search(const int a[], int n, int target) {
    int low = 0, high = n - 1;  @@0
    while (low <= high) {  @@1
        int mid = low + (high - low) / 2;  @@2
        if (a[mid] == target) return mid;  @@3
        if (a[mid] < target) low = mid + 1;  @@4
        else high = mid - 1;  @@5
    }
    return -1;  @@6
}`,
  },

  'bubble-sort': {
    python: `
def bubble_sort(a):
    n = len(a)
    for p in range(n - 1):  @@0
        swapped = False
        for j in range(n - 1 - p):  @@1
            if a[j] > a[j + 1]:  @@2
                a[j], a[j + 1] = a[j + 1], a[j]  @@3
                swapped = True  @@3
        # a[n - 1 - p] is now in its final place  @@4
        if not swapped:  @@5
            break  @@5`,
    java: `
static void bubbleSort(int[] a) {
    int n = a.length;
    for (int pass = 0; pass < n - 1; pass++) {  @@0
        boolean swapped = false;
        for (int j = 0; j < n - 1 - pass; j++) {  @@1
            if (a[j] > a[j + 1]) {  @@2
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;  @@3
                swapped = true;  @@3
            }
        }
        // a[n - 1 - pass] is now in its final place  @@4
        if (!swapped) break;  @@5
    }
}`,
    cpp: `
void bubbleSort(vector<int>& a) {
    int n = a.size();
    for (int pass = 0; pass < n - 1; pass++) {  @@0
        bool swapped = false;
        for (int j = 0; j < n - 1 - pass; j++) {  @@1
            if (a[j] > a[j + 1]) {  @@2
                swap(a[j], a[j + 1]);  @@3
                swapped = true;  @@3
            }
        }
        // a[n - 1 - pass] is now in its final place  @@4
        if (!swapped) break;  @@5
    }
}`,
    c: `
void bubble_sort(int a[], int n) {
    for (int pass = 0; pass < n - 1; pass++) {  @@0
        int swapped = 0;
        for (int j = 0; j < n - 1 - pass; j++) {  @@1
            if (a[j] > a[j + 1]) {  @@2
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;  @@3
                swapped = 1;  @@3
            }
        }
        // a[n - 1 - pass] is now in its final place  @@4
        if (!swapped) break;  @@5
    }
}`,
  },

  'selection-sort': {
    python: `
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):  @@0
        smallest = i  @@1
        for j in range(i + 1, n):  @@2
            if a[j] < a[smallest]:  @@3
                smallest = j  @@3
        a[i], a[smallest] = a[smallest], a[i]  @@4`,
    java: `
static void selectionSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {  @@0
        int min = i;  @@1
        for (int j = i + 1; j < n; j++) {  @@2
            if (a[j] < a[min]) min = j;  @@3
        }
        int t = a[i]; a[i] = a[min]; a[min] = t;  @@4
    }
}`,
    cpp: `
void selectionSort(vector<int>& a) {
    int n = a.size();
    for (int i = 0; i < n - 1; i++) {  @@0
        int min = i;  @@1
        for (int j = i + 1; j < n; j++) {  @@2
            if (a[j] < a[min]) min = j;  @@3
        }
        swap(a[i], a[min]);  @@4
    }
}`,
    c: `
void selection_sort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {  @@0
        int min = i;  @@1
        for (int j = i + 1; j < n; j++) {  @@2
            if (a[j] < a[min]) min = j;  @@3
        }
        int t = a[i]; a[i] = a[min]; a[min] = t;  @@4
    }
}`,
  },

  'insertion-sort': {
    python: `
def insertion_sort(a):
    for i in range(1, len(a)):  @@0
        j = i  @@1
        while j > 0 and a[j - 1] > a[j]:  @@2
            a[j - 1], a[j] = a[j], a[j - 1]  @@3
            j -= 1  @@4`,
    java: `
static void insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {  @@0
        int j = i;  @@1
        while (j > 0 && a[j - 1] > a[j]) {  @@2
            int t = a[j - 1]; a[j - 1] = a[j]; a[j] = t;  @@3
            j--;  @@4
        }
    }
}`,
    cpp: `
void insertionSort(vector<int>& a) {
    for (int i = 1; i < (int)a.size(); i++) {  @@0
        int j = i;  @@1
        while (j > 0 && a[j - 1] > a[j]) {  @@2
            swap(a[j - 1], a[j]);  @@3
            j--;  @@4
        }
    }
}`,
    c: `
void insertion_sort(int a[], int n) {
    for (int i = 1; i < n; i++) {  @@0
        int j = i;  @@1
        while (j > 0 && a[j - 1] > a[j]) {  @@2
            int t = a[j - 1]; a[j - 1] = a[j]; a[j] = t;  @@3
            j--;  @@4
        }
    }
}`,
  },

  'merge-sort': {
    python: `
def merge_sort(a, lo, hi):  @@0
    if lo >= hi:  @@1
        return  @@1
    mid = (lo + hi) // 2  @@2
    merge_sort(a, lo, mid)  @@3
    merge_sort(a, mid + 1, hi)  @@3
    merge(a, lo, mid, hi)  @@4

def merge(a, lo, mid, hi):  @@4
    left, right = a[lo:mid + 1], a[mid + 1:hi + 1]
    i = j = 0
    k = lo
    while i < len(left) and j < len(right):  @@5
        if right[j] < left[i]:  @@5
            a[k] = right[j]  @@6
            j += 1  @@6
        else:
            a[k] = left[i]  @@6
            i += 1  @@6
        k += 1
    a[k:hi + 1] = left[i:] + right[j:]`,
    java: `
static void mergeSort(int[] a, int lo, int hi) {  @@0
    if (lo >= hi) return;  @@1
    int mid = (lo + hi) / 2;  @@2
    mergeSort(a, lo, mid);  @@3
    mergeSort(a, mid + 1, hi);  @@3
    merge(a, lo, mid, hi);  @@4
}

static void merge(int[] a, int lo, int mid, int hi) {  @@4
    int[] tmp = new int[hi - lo + 1];
    int i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi) {  @@5
        if (a[j] < a[i]) tmp[k++] = a[j++];  @@6
        else tmp[k++] = a[i++];  @@6
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi) tmp[k++] = a[j++];
    for (k = 0; k < tmp.length; k++) a[lo + k] = tmp[k];
}`,
    cpp: `
void merge(vector<int>& a, int lo, int mid, int hi) {  @@4
    vector<int> tmp;
    int i = lo, j = mid + 1;
    while (i <= mid && j <= hi) {  @@5
        if (a[j] < a[i]) tmp.push_back(a[j++]);  @@6
        else tmp.push_back(a[i++]);  @@6
    }
    while (i <= mid) tmp.push_back(a[i++]);
    while (j <= hi) tmp.push_back(a[j++]);
    copy(tmp.begin(), tmp.end(), a.begin() + lo);
}

void mergeSort(vector<int>& a, int lo, int hi) {  @@0
    if (lo >= hi) return;  @@1
    int mid = (lo + hi) / 2;  @@2
    mergeSort(a, lo, mid);  @@3
    mergeSort(a, mid + 1, hi);  @@3
    merge(a, lo, mid, hi);  @@4
}`,
    c: `
void merge(int a[], int lo, int mid, int hi) {  @@4
    int tmp[hi - lo + 1];
    int i = lo, j = mid + 1, k = 0;
    while (i <= mid && j <= hi) {  @@5
        if (a[j] < a[i]) tmp[k++] = a[j++];  @@6
        else tmp[k++] = a[i++];  @@6
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= hi) tmp[k++] = a[j++];
    for (k = 0; k < hi - lo + 1; k++) a[lo + k] = tmp[k];
}

void merge_sort(int a[], int lo, int hi) {  @@0
    if (lo >= hi) return;  @@1
    int mid = (lo + hi) / 2;  @@2
    merge_sort(a, lo, mid);  @@3
    merge_sort(a, mid + 1, hi);  @@3
    merge(a, lo, mid, hi);  @@4
}`,
  },

  'quick-sort': {
    python: `
def quick_sort(a, lo, hi):  @@0
    if lo >= hi:  @@1
        return  @@1
    pivot = a[hi]  @@2
    i = lo  @@2
    for j in range(lo, hi):  @@3
        if a[j] < pivot:  @@4
            a[i], a[j] = a[j], a[i]  @@4
            i += 1  @@4
    a[i], a[hi] = a[hi], a[i]  @@5
    quick_sort(a, lo, i - 1)  @@6
    quick_sort(a, i + 1, hi)  @@6`,
    java: `
static void quickSort(int[] a, int lo, int hi) {  @@0
    if (lo >= hi) return;  @@1
    int pivot = a[hi], i = lo;  @@2
    for (int j = lo; j < hi; j++) {  @@3
        if (a[j] < pivot) {  @@4
            int t = a[i]; a[i] = a[j]; a[j] = t;  @@4
            i++;  @@4
        }
    }
    int t = a[i]; a[i] = a[hi]; a[hi] = t;  @@5
    quickSort(a, lo, i - 1);  @@6
    quickSort(a, i + 1, hi);  @@6
}`,
    cpp: `
void quickSort(vector<int>& a, int lo, int hi) {  @@0
    if (lo >= hi) return;  @@1
    int pivot = a[hi], i = lo;  @@2
    for (int j = lo; j < hi; j++) {  @@3
        if (a[j] < pivot) {  @@4
            swap(a[i], a[j]);  @@4
            i++;  @@4
        }
    }
    swap(a[i], a[hi]);  @@5
    quickSort(a, lo, i - 1);  @@6
    quickSort(a, i + 1, hi);  @@6
}`,
    c: `
void quick_sort(int a[], int lo, int hi) {  @@0
    if (lo >= hi) return;  @@1
    int pivot = a[hi], i = lo;  @@2
    for (int j = lo; j < hi; j++) {  @@3
        if (a[j] < pivot) {  @@4
            int t = a[i]; a[i] = a[j]; a[j] = t;  @@4
            i++;  @@4
        }
    }
    int t = a[i]; a[i] = a[hi]; a[hi] = t;  @@5
    quick_sort(a, lo, i - 1);  @@6
    quick_sort(a, i + 1, hi);  @@6
}`,
  },

  'heap-sort': {
    python: `
def heap_sort(a):
    n = len(a)
    # build a max-heap  @@0
    for i in range(n // 2 - 1, -1, -1):  @@1
        sift_down(a, i, n)  @@1
    for end in range(n - 1, 0, -1):  @@2
        a[0], a[end] = a[end], a[0]  @@3
        sift_down(a, 0, end)  @@4

def sift_down(a, i, size):
    while 2 * i + 1 < size:
        child = 2 * i + 1
        if child + 1 < size and a[child + 1] > a[child]:  @@5
            child += 1  @@5
        if a[child] <= a[i]:  @@5
            return
        a[i], a[child] = a[child], a[i]  @@5
        i = child`,
    java: `
static void heapSort(int[] a) {
    int n = a.length;
    // build a max-heap  @@0
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n);  @@1
    for (int end = n - 1; end >= 1; end--) {  @@2
        int t = a[0]; a[0] = a[end]; a[end] = t;  @@3
        siftDown(a, 0, end);  @@4
    }
}

static void siftDown(int[] a, int i, int size) {
    while (2 * i + 1 < size) {
        int child = 2 * i + 1;
        if (child + 1 < size && a[child + 1] > a[child]) child++;  @@5
        if (a[child] <= a[i]) return;  @@5
        int t = a[i]; a[i] = a[child]; a[child] = t;  @@5
        i = child;
    }
}`,
    cpp: `
void siftDown(vector<int>& a, int i, int size) {
    while (2 * i + 1 < size) {
        int child = 2 * i + 1;
        if (child + 1 < size && a[child + 1] > a[child]) child++;  @@5
        if (a[child] <= a[i]) return;  @@5
        swap(a[i], a[child]);  @@5
        i = child;
    }
}

void heapSort(vector<int>& a) {
    int n = a.size();
    // build a max-heap  @@0
    for (int i = n / 2 - 1; i >= 0; i--) siftDown(a, i, n);  @@1
    for (int end = n - 1; end >= 1; end--) {  @@2
        swap(a[0], a[end]);  @@3
        siftDown(a, 0, end);  @@4
    }
}`,
    c: `
void sift_down(int a[], int i, int size) {
    while (2 * i + 1 < size) {
        int child = 2 * i + 1;
        if (child + 1 < size && a[child + 1] > a[child]) child++;  @@5
        if (a[child] <= a[i]) return;  @@5
        int t = a[i]; a[i] = a[child]; a[child] = t;  @@5
        i = child;
    }
}

void heap_sort(int a[], int n) {
    // build a max-heap  @@0
    for (int i = n / 2 - 1; i >= 0; i--) sift_down(a, i, n);  @@1
    for (int end = n - 1; end >= 1; end--) {  @@2
        int t = a[0]; a[0] = a[end]; a[end] = t;  @@3
        sift_down(a, 0, end);  @@4
    }
}`,
  },
};

export interface CodeLine {
  text: string;
  /** The pseudocode line this belongs to, or undefined. */
  step?: number;
}

/** Splits a snippet into lines and reads the "@@N" markers off their ends. */
export function parseCode(source: string): CodeLine[] {
  return source
    .replace(/^\n/, '')
    .split('\n')
    .map((line) => {
      const match = line.match(/\s*@@(\d+)\s*$/);
      return match ? { text: line.slice(0, match.index), step: Number(match[1]) } : { text: line };
    });
}
