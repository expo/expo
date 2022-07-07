package com.shopify.reactnative.flash_list

import com.google.gson.Gson
import com.shopify.reactnative.flash_list.models.Rect
import com.shopify.reactnative.flash_list.models.TestDataModel
import org.junit.Assert.assertEquals
import org.junit.Test

internal class AutoLayoutShadowTest {
    private val gson = Gson()

    /**
     * Test against expected output from stored JSON */
    @Test
    fun clearGapsAndOverlapsVerticalList() {
        val alShadow = getAutolayoutShadow(0)
        val testModel = getTestModel()
        testModel.vertical.forEachIndexed { index, it ->
            alShadow.clearGapsAndOverlaps(it.input as Array<CellContainer>)
            assertEquals("Index: $index", gson.toJson(it.expectedOutput), gson.toJson(it.input))
        }
    }

    /**
     * Test against expected output from stored JSON */
    @Test
    fun clearGapsAndOverlapsHorizontalList() {
        val alShadow = getAutolayoutShadow(0)
        alShadow.horizontal = true
        val testModel = getTestModel()
        testModel.horizontal.forEachIndexed { index, it ->
            alShadow.clearGapsAndOverlaps(it.input as Array<CellContainer>)
            assertEquals("Index: $index", gson.toJson(it.expectedOutput), gson.toJson(it.input))
        }
    }

    /**
     * Test against expected output from stored JSON */
    @Test
    fun clearGapsAndOverlapsWindowSize() {
        val alShadow = getAutolayoutShadow(0)
        alShadow.horizontal = true
        alShadow.windowSize = 90
        val testModel = getTestModel()
        testModel.window.forEachIndexed { index, it ->
            alShadow.clearGapsAndOverlaps(it.input as Array<CellContainer>)
            assertEquals("Index: $index", gson.toJson(it.expectedOutput), gson.toJson(it.input))
        }
    }

    /**
     * Should only correct items in the visible window*/
    @Test
    fun clearGapsAndOverlapsBoundaryTest() {
        val alShadow = getAutolayoutShadow(300)
        alShadow.renderOffset = 100

        //--------- Vertical -----------
        //Item above visible window
        arrayOf<CellContainer>(getRect(0, 0, 100, 100), getRect(120, 0, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(120, it[1].left)
        }

        //Item below visible window
        arrayOf<CellContainer>(getRect(0, 0, 100, 100), getRect(120, 550, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(550, it[1].top)
        }

        //Item within visible window
        arrayOf<CellContainer>(getRect(0, 250, 100, 100), getRect(120, 250, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(100, it[1].left)
        }

        //At the top edge
        arrayOf<CellContainer>(getRect(0, 200, 100, 100), getRect(120, 200, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(100, it[1].left)
        }

        //--------- Horizontal -----------

        alShadow.horizontal = true

        //Item left of visible window
        arrayOf<CellContainer>(getRect(0, 0, 100, 100), getRect(0, 120, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(120, it[1].top)
        }

        //Item right of visible window
        arrayOf<CellContainer>(getRect(0, 0, 100, 100), getRect(550, 120, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(120, it[1].top)
        }

        //Item within visible window
        arrayOf<CellContainer>(getRect(250, 0, 100, 100), getRect(250, 120, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(100, it[1].top)
        }

        //At the left edge
        arrayOf<CellContainer>(getRect(200, 0, 100, 100), getRect(250, 150, 100, 100)).let {
            alShadow.clearGapsAndOverlaps(it)
            assertEquals(100, it[1].top)
        }
    }

    @Test
    fun checkBlankForLastItem() {
        val alShadow = getAutolayoutShadow(0)
        val testModel = getTestModel()
        testModel.vertical.forEachIndexed { index, it ->
            alShadow.clearGapsAndOverlaps(it.input as Array<CellContainer>)
            it.expectedOutput.map { value -> value.bottom }.maxOrNull()?.let { max ->
                alShadow.computeBlankFromGivenOffset(0, 0, 0)
                assertEquals("Index: $index", alShadow.windowSize - max, alShadow.blankOffsetAtEnd)
            }
        }
    }

    private fun getTestModel(): TestDataModel {
        var str = this.javaClass.classLoader.getResource("LayoutTestData.json").readText()
        return gson.fromJson<TestDataModel>(str, TestDataModel::class.java)
    }

    private fun getRect(l: Int, t: Int, r: Int, b: Int): Rect {
        var rect = Rect(b - t, r - l)
        rect.left = l
        rect.right = r
        rect.bottom = b
        rect.top = t
        return rect
    }

    private fun getAutolayoutShadow(offset: Int): AutoLayoutShadow {
        val alShadow = AutoLayoutShadow()
        alShadow.windowSize = 500
        alShadow.renderOffset = 0
        alShadow.scrollOffset = offset
        return alShadow
    }
}
